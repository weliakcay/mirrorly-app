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

// Tek model stratejisi: tum istekler flux-2/pro-image-to-image 1K.
// GPT Image 2 multi-image try-on icin uygun degil; flux-2 [user, garment]
// kompozisyonunu basariyla yapiyor. Preset secimi UI'dan kaldirildi.
const PRIMARY_CONFIG: KiePresetConfig = {
  type: "market",
  family: "flux-2",
  model: process.env.KIE_MODEL_PRIMARY || "flux-2/pro-image-to-image",
  resolution: "1K",
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
Create one single photorealistic virtual try-on image.

INPUTS:
- Image 1 = the CUSTOMER (real person). This is the SUBJECT of the final image.
- Image 2 = the EXACT GARMENT to transfer ("${garmentName}"). It may show the
  garment alone, on a hanger, on a mannequin, or worn by a model of any
  gender/age/body type.

CRITICAL RULES:

1. PERSON (Image 1): The final image MUST show the CUSTOMER from Image 1.
   Preserve their face, identity, hair, skin tone, pose, body proportions,
   camera angle, background and lighting environment. NEVER swap, replace
   or merge the customer with the mannequin/model from Image 2.

2. GARMENT (Image 2): Transfer the EXACT garment piece from Image 2 onto the
   customer with NO modifications:
   - Keep the EXACT design, color, fabric, pattern, neckline, sleeves, hem,
     length, cut and silhouette as shown in Image 2.
   - DO NOT redesign, restyle, lengthen, shorten, gender-swap, or "adapt"
     the garment to the customer's gender, age or body. If Image 2 shows
     a crop top with short shorts, the result must show the SAME crop top
     and SAME short shorts on the customer - even if it looks unusual.
   - This is a faithful try-on, NOT personal styling. Treat the garment as
     a fixed costume to be worn as-is.
   - Ignore the mannequin/model body, skin, head, hair, hands, background
     and pose from Image 2 entirely.

3. COMPOSITION: Replace ONLY the customer's existing clothing in the area
   the new garment covers. Match the garment's lighting, folds, shadows and
   perspective to Image 1's scene so it sits naturally on their body.

Garment reference details: ${garmentDescription || garmentName}

Output ONLY the final composited image of the customer from Image 1 wearing
the EXACT garment from Image 2.
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
