import { ModelPreset } from "../types";

const KIE_API_BASE = "https://api.kie.ai";
const DEFAULT_TIMEOUT_MS = 85_000; // Vercel limit is 90s. 85s allows clean JSON response.
const POLL_INTERVAL_MS = 2_500;
const GOOGLE_BILLING_DISABLED_PATTERNS = [
  "billing account for the owning project is disabled",
  "accountdisabled",
  "billing account",
];

type KiePresetConfig =
  {
    type: "market";
    family: "flux-2" | "nano-banana" | "gpt-image" | "gpt-image-2";
    model: string;
    resolution?: "1K" | "2K";
    aspectRatio?: string;
  };

// Tek model stratejisi: tum istekler GPT Image 2 1K. Maliyet/yazi+detay
// dengesinde flux-2'den iyi sonuc veriyor. Preset secimi UI'dan kaldirildi.
const PRIMARY_CONFIG: KiePresetConfig = {
  type: "market",
  family: "gpt-image-2",
  model: process.env.KIE_MODEL_PRIMARY || "gpt-image-2-image-to-image",
  resolution: "1K",
  aspectRatio: "3:4",
};

const PRESET_CONFIG: Record<ModelPreset, KiePresetConfig> = {
  economy: PRIMARY_CONFIG,
  balanced: PRIMARY_CONFIG,
  premium: PRIMARY_CONFIG,
};

const MARKET_FALLBACK_CONFIG: KiePresetConfig = {
  type: "market",
  family: "flux-2",
  model: process.env.KIE_MODEL_MARKET_FALLBACK || "flux-2/flex-image-to-image",
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

INPUTS:
- Image 1 = the CUSTOMER (real person). This is the SUBJECT of the final image.
- Image 2 = the GARMENT reference. It may show the garment alone, on a hanger,
  on a mannequin, or worn by a model. Image 2 is ONLY a reference for the
  garment's design, color, fabric, pattern, cut, length and details.

CRITICAL RULES:
- The final image MUST show the CUSTOMER from Image 1, NOT the mannequin/model
  from Image 2. Never swap, replace, or merge Image 1's person with anyone from
  Image 2. Only the garment is transferred.
- Preserve from Image 1: face, identity, hair, skin tone, pose, body proportions,
  background and lighting environment.
- Take from Image 2 ONLY: the garment ("${garmentName}") with its exact design,
  color, fabric, pattern and silhouette. Ignore the mannequin/model body, their
  skin, head, hair, hands, background and pose entirely.
- Replace the customer's existing clothing only in the garment's coverage area.
- Match the garment's lighting and shadows to Image 1's scene so it looks natural.

Garment details for reference: ${garmentDescription || garmentName}

Return only the final composited image of the customer from Image 1 wearing the garment from Image 2.
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

  if (config.family === "gpt-image-2") {
    // GPT Image 2 i2i. Aspect ratio enum'unda 2:3 yok, en yakin portrait 3:4.
    input = {
      prompt,
      input_urls: [userImageUrl, garmentImageUrl],
      aspect_ratio: config.aspectRatio || "3:4",
      resolution: config.resolution || "1K",
    };
  } else if (config.family === "flux-2" || isFlux2ImageEditModel(config.model)) {
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
