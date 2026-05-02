const KIE_API_BASE = "https://api.kie.ai";
const KIE_UPLOAD_API_BASE = "https://kieai.redpandaai.co";
const DEFAULT_TIMEOUT_MS = 90000;
const POLL_INTERVAL_MS = 2500;

// Tek model stratejisi: tum istekler GPT Image 2 1K. Maliyet/yazi+detay
// koruma dengesinde flux-2'den iyi sonuc veriyor. Preset secimi UI'dan
// kaldirildi; eski profillerin modelPreset alanindan ne gelirse gelsin
// hep ayni config'e maplenir. Fallback: flux-2/flex (GPT hatasinda).
const PRIMARY_CONFIG = {
  type: "market",
  family: "gpt-image-2",
  model: process.env.KIE_MODEL_PRIMARY || "gpt-image-2-image-to-image",
  resolution: "1K",
  aspectRatio: "3:4",
};

const PRESET_CONFIG = {
  economy: PRIMARY_CONFIG,
  balanced: PRIMARY_CONFIG,
  premium: PRIMARY_CONFIG,
};

const MARKET_FALLBACK_CONFIG = {
  family: "flux-2",
  model: process.env.KIE_MODEL_MARKET_FALLBACK || "flux-2/flex-image-to-image",
  resolution: "1K",
};

const GOOGLE_BILLING_DISABLED_PATTERNS = [
  "billing account for the owning project is disabled",
  "accountdisabled",
  "billing account",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getKieApiKey = () => {
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    throw new Error("KIE_API_KEY tanımlanmamış.");
  }
  return apiKey;
};

const buildPrompt = (garmentName, garmentDescription) => `
Create one single photorealistic virtual try-on image.

INPUTS:
- Image 1 = the CUSTOMER (real person). This is the SUBJECT of the final image.
- Image 2 = the GARMENT reference (${garmentName}). It may show the garment alone,
  on a hanger, on a mannequin, or worn by a model. Image 2 is ONLY a reference for
  the garment's design, color, fabric, pattern, cut and details.

CRITICAL RULES:
- The final image MUST show the CUSTOMER from Image 1, NOT the mannequin/model
  from Image 2. Never swap, replace, or merge Image 1's person with anyone from
  Image 2. Only the garment is transferred.
- Preserve from Image 1: face, identity, hair, skin tone, pose, body proportions,
  camera angle, background and lighting environment.
- Take from Image 2 ONLY: the garment with its exact design, color, fabric, pattern,
  cut and silhouette. Ignore the mannequin/model body, their skin, head, hair,
  hands, background and pose entirely.
- Replace the customer's existing clothing only in the garment's coverage area.
- Match the garment's lighting, folds, shadows, and perspective to Image 1's scene
  so it looks natural.
- Output only one final edited image.

Do not:
- do not place the garment beside the person
- do not create a collage, split screen, moodboard, before/after, or picture-in-picture
- do not show the original garment as a floating item, corner card, or extra object
- do not duplicate the person
- do not use the mannequin/model from Image 2 as the person in the final image

Garment details: ${garmentDescription || garmentName}
`;

const isFlux2ImageEditModel = (model) => String(model || "").startsWith("flux-2/");

const kieFetch = async (path, init) => {
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
      payload?.msg || payload?.errorMessage || `Kie.ai hatası (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

const kieUploadFetch = async (path, init) => {
  const response = await fetch(`${KIE_UPLOAD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getKieApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload || payload.success !== true) {
    const message =
      payload?.msg || payload?.errorMessage || `Kie upload hatasi (${response.status})`;
    throw new Error(message);
  }

  return payload;
};

export const uploadBase64FileToKie = async ({ base64Data, uploadPath, fileName }) => {
  const payload = await kieUploadFetch("/api/file-base64-upload", {
    method: "POST",
    body: JSON.stringify({
      base64Data,
      uploadPath,
      fileName,
    }),
  });

  const downloadUrl = payload?.data?.downloadUrl;
  if (!downloadUrl) {
    throw new Error("Kie upload gecici dosya baglantisi donmedi.");
  }

  return downloadUrl;
};

const isGoogleBillingDisabledError = (error) => {
  const message = String(error?.message || "").toLowerCase();
  return GOOGLE_BILLING_DISABLED_PATTERNS.some((pattern) => message.includes(pattern));
};

const createMarketTask = async (config, userImageUrl, garmentImageUrl, prompt) => {
  let input;

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

  return payload.data.taskId;
};

const pollMarketTask = async (taskId) => {
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
      return resultUrl;
    }

    if (state === "fail") {
      throw new Error(payload.data?.failMsg || "Kie.ai görsel oluşturmayı tamamlayamadı.");
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error("Kie.ai işlem süresi aşıldı.");
};

const tryMarketFallback = async (userImageUrl, garmentImageUrl, prompt) => {
  const fallbackTaskId = await createMarketTask(MARKET_FALLBACK_CONFIG, userImageUrl, garmentImageUrl, prompt);
  return pollMarketTask(fallbackTaskId);
};

export const generateTryOnWithKie = async ({
  garmentName,
  garmentDescription,
  garmentImageUrl,
  preset,
  userImageUrl,
}) => {
  const prompt = buildPrompt(garmentName, garmentDescription);
  const config = PRESET_CONFIG[preset] || PRESET_CONFIG.balanced;

  try {
    const taskId = await createMarketTask(config, userImageUrl, garmentImageUrl, prompt);
    return pollMarketTask(taskId);
  } catch (error) {
    if (isGoogleBillingDisabledError(error)) {
      console.warn(`Kie market modeli kullanilamadi (${config.model}). Flux fallback deneniyor.`);
      return tryMarketFallback(userImageUrl, garmentImageUrl, prompt);
    }

    if (config.family !== "flux-2") {
      console.warn(`Kie modeli basarisiz oldu (${config.model}). Flux fallback deneniyor.`);
      return tryMarketFallback(userImageUrl, garmentImageUrl, prompt);
    }

    throw error;
  }
};
