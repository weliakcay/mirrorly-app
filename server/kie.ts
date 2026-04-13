import { ModelPreset } from "../types";

const KIE_API_BASE = "https://api.kie.ai";
const DEFAULT_TIMEOUT_MS = 90_000;
const POLL_INTERVAL_MS = 2_500;

type KiePresetConfig =
  | {
      type: "market";
      model: string;
      resolution: "1K" | "2K";
    }
  | {
      type: "gpt4o";
      model: "gpt4o-image";
    };

const PRESET_CONFIG: Record<ModelPreset, KiePresetConfig> = {
  economy: {
    type: "market",
    model: process.env.KIE_MODEL_ECONOMY || "flux-2/flex-image-to-image",
    resolution: "1K",
  },
  balanced: {
    type: "market",
    model: process.env.KIE_MODEL_BALANCED || "flux-2/pro-image-to-image",
    resolution: "1K",
  },
  premium: {
    type: "market",
    model:
      process.env.KIE_MODEL_PREMIUM &&
      process.env.KIE_MODEL_PREMIUM !== "gpt4o-image"
        ? process.env.KIE_MODEL_PREMIUM
        : "flux-2/pro-image-to-image",
    resolution: "2K",
  },
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
  model: string,
  userImageUrl: string,
  garmentImageUrl: string,
  prompt: string,
  resolution: "1K" | "2K" = "1K"
) => {
  const payload = await kieFetch("/api/v1/jobs/createTask", {
    method: "POST",
    body: JSON.stringify({
      model,
      input: {
        input_urls: [userImageUrl, garmentImageUrl],
        prompt,
        aspect_ratio: "2:3",
        resolution,
        nsfw_checker: false,
      },
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

const create4oTask = async (
  userImageUrl: string,
  garmentImageUrl: string,
  prompt: string
) => {
  const payload = await kieFetch("/api/v1/gpt4o-image/generate", {
    method: "POST",
    body: JSON.stringify({
      filesUrl: [userImageUrl, garmentImageUrl],
      prompt,
      size: "2:3",
      isEnhance: true,
      enableFallback: true,
      fallbackModel: "FLUX_MAX",
    }),
  });

  return payload.data.taskId as string;
};

const poll4oTask = async (taskId: string) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < DEFAULT_TIMEOUT_MS) {
    const payload = await kieFetch(
      `/api/v1/gpt4o-image/record-info?taskId=${encodeURIComponent(taskId)}`,
      { method: "GET" }
    );

    const status = payload.data?.status;
    if (status === "SUCCESS") {
      const resultUrl = payload.data?.response?.resultUrls?.[0];
      if (!resultUrl) {
        throw new Error("Kie.ai premium model sonuç üretmedi.");
      }
      return resultUrl as string;
    }

    if (status === "GENERATE_FAILED" || status === "CREATE_TASK_FAILED") {
      throw new Error(payload.data?.errorMessage || "Kie.ai premium model başarısız oldu.");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Kie.ai premium işlem süresi aşıldı.");
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

  if (config.type === "gpt4o") {
    const taskId = await create4oTask(userImageUrl, garmentImageUrl, prompt);
    return poll4oTask(taskId);
  }

  const taskId = await createMarketTask(
    config.model,
    userImageUrl,
    garmentImageUrl,
    prompt,
    config.resolution
  );
  return pollMarketTask(taskId);
};
