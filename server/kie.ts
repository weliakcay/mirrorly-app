import { ModelPreset } from "../types";

const KIE_API_BASE = "https://api.kie.ai";
const DEFAULT_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 2_500;
const GOOGLE_BILLING_DISABLED_PATTERNS = [
  "billing account for the owning project is disabled",
  "accountdisabled",
  "billing account",
];

type KiePresetConfig =
  {
    type: "market";
    family: "flux-2" | "nano-banana" | "gpt-image";
    model: string;
    resolution?: "1K" | "2K";
  };

const PRESET_CONFIG: Record<ModelPreset, KiePresetConfig> = {
  economy: {
    type: "market",
    family: "gpt-image",
    model: process.env.KIE_MODEL_ECONOMY || "gpt-image/1.5-image-to-image",
  },
  balanced: {
    type: "market",
    family: "nano-banana",
    model: process.env.KIE_MODEL_BALANCED || "nano-banana-2",
    resolution: "1K",
  },
  premium: {
    type: "market",
    family: "flux-2",
    model: process.env.KIE_MODEL_PREMIUM || "flux-2/pro-image-to-image",
    resolution: "2K",
  },
};

const MARKET_FALLBACK_CONFIG: KiePresetConfig = {
  type: "market",
  family: "flux-2",
  model: process.env.KIE_MODEL_MARKET_FALLBACK || "flux-2/pro-image-to-image",
  resolution: "1K",
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getKieApiKey = () => {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error("KIE_API_KEY tanımlanmamış.");
  }
  return apiKey;
};

const buildPrompt = (garmentName: string, garmentDescription: string) => `
Create a photorealistic virtual try-on image.

Image 1 is the person. Image 2 is the garment.

Goals:
- Put the garment (${garmentName}) on the person naturally.
- Preserve the person's face, hair, skin tone, pose, and body proportions.
- Replace the original clothing only where needed.
- Keep the garment details accurate to the reference image.
- Match lighting and shadows to the original scene.
- Return a clean, realistic final image only.

Garment details: ${garmentDescription || garmentName}
`;

const isFlux2ImageEditModel = (model: string) => String(model || "").startsWith("flux-2/");

const isGoogleBillingDisabledError = (error: unknown) => {
  const message = String((error as any)?.message || "").toLowerCase();
  return GOOGLE_BILLING_DISABLED_PATTERNS.some((pattern) => message.includes(pattern));
};

const kieFetch = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${KIE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKieApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.code !== 200) {
    const message =
      payload?.msg ||
      payload?.errorMessage ||
      `Kie.ai hatası (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const createMarketTask = async (
  config: KiePresetConfig,
  userImageUrl: string,
  garmentImageUrl: string,
  prompt: string
) => {
  let input: Record<string, unknown>;

  if (config.family === "flux-2" || isFlux2ImageEditModel(config.model)) {
    input = {
      input_urls: [userImageUrl, garmentImageUrl],
      prompt,
      aspect_ratio: "2:3",
      resolution: config.resolution || "1K",
      nsfw_checker: false,
    };
  } else if (config.family === "nano-banana") {
    input = {
      prompt,
      image_input: [userImageUrl, garmentImageUrl],
      aspect_ratio: "2:3",
      resolution: config.resolution || "1K",
      output_format: "png",
      google_search: false,
    };
  } else {
    input = {
      prompt,
      image_urls: [userImageUrl, garmentImageUrl],
      output_format: "png",
      image_size: "2:3",
    };
  }

  const payload = await kieFetch("/api/v1/jobs/createTask", {
    method: "POST",
    body: JSON.stringify({
      model: config.model,
      input,
    }),
  });

  return payload.data.taskId as string;
};

const pollMarketTask = async (taskId: string) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    const payload = await kieFetch(
      `/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      { method: "GET" }
    );
    const state = payload.data?.state;

    if (state === "success") {
      const resultJson = payload.data?.resultJson ? JSON.parse(payload.data.resultJson) : {};
      const resultUrl = resultJson?.resultUrls?.[0];
      if (!resultUrl) {
        throw new Error("Kie.ai sonuç görseli döndürmedi.");
      }
      return resultUrl as string;
    }

    if (state === "fail") {
      throw new Error(payload.data?.failMsg || "Kie.ai görsel oluşturmayı tamamlayamadı.");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Kie.ai işlem süresi aşıldı.");
};

const tryMarketFallback = async (
  userImageUrl: string,
  garmentImageUrl: string,
  prompt: string
) => {
  const fallbackTaskId = await createMarketTask(
    MARKET_FALLBACK_CONFIG,
    userImageUrl,
    garmentImageUrl,
    prompt
  );
  return pollMarketTask(fallbackTaskId);
};

export const generateTryOnWithKie = async ({
  garmentName,
  garmentDescription,
  garmentImageUrl,
  preset,
  userImageUrl,
}: {
  garmentName: string;
  garmentDescription: string;
  garmentImageUrl: string;
  preset: ModelPreset;
  userImageUrl: string;
}) => {
  const prompt = buildPrompt(garmentName, garmentDescription);
  const config = PRESET_CONFIG[preset] || PRESET_CONFIG.balanced;

  try {
    const taskId = await createMarketTask(config, userImageUrl, garmentImageUrl, prompt);
    return pollMarketTask(taskId);
  } catch (error) {
    if (isGoogleBillingDisabledError(error) || config.family !== "flux-2") {
      return tryMarketFallback(userImageUrl, garmentImageUrl, prompt);
    }

    throw error;
  }
};
