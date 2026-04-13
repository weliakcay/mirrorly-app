const KIE_API_BASE = "https://api.kie.ai";
const KIE_UPLOAD_API_BASE = "https://kieai.redpandaai.co";
const DEFAULT_TIMEOUT_MS = 90000;
const POLL_INTERVAL_MS = 2500;

const PRESET_CONFIG = {
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

const MARKET_FALLBACK_MODEL =
  process.env.KIE_MODEL_MARKET_FALLBACK || "flux-2/flex-image-to-image";

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

Image 1: the person photo. Keep this as the base image.
Image 2: the garment reference (${garmentName}). Use it only as the clothing reference.

Strict instructions:
- Dress the person in image 1 with the garment from image 2.
- Preserve the person's face, hair, body proportions, pose, skin tone, camera angle, and background.
- Preserve the garment's cut, color, texture, fabric details, and silhouette from the reference.
- Replace only the relevant clothing area. Do not unnecessarily change uncovered body parts.
- Match lighting, folds, shadows, and perspective naturally.
- Output only one final edited image.

Do not:
- do not place the garment beside the person
- do not create a collage, split screen, moodboard, before/after, or picture-in-picture
- do not show the original garment as a floating item, corner card, or extra object
- do not duplicate the person
- do not change the scene into a fashion poster unless required by the original image

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

const createMarketTask = async (model, userImageUrl, garmentImageUrl, prompt, resolution = "1K") => {
  const input = isFlux2ImageEditModel(model)
    ? {
        input_urls: [userImageUrl, garmentImageUrl],
        prompt,
        aspect_ratio: "2:3",
        resolution,
        nsfw_checker: false,
      }
    : {
        prompt,
        image_urls: [userImageUrl, garmentImageUrl],
        output_format: "png",
        image_size: "2:3",
      };

  const payload = await kieFetch("/api/v1/jobs/createTask", {
    method: "POST",
    body: JSON.stringify({
      model,
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

const create4oTask = async (userImageUrl, garmentImageUrl, prompt) => {
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

  return payload.data.taskId;
};

const tryPremiumFallback = async (userImageUrl, garmentImageUrl, prompt) => {
  const fallbackTaskId = await create4oTask(userImageUrl, garmentImageUrl, prompt);
  return poll4oTask(fallbackTaskId);
};

const tryMarketFallback = async (userImageUrl, garmentImageUrl, prompt) => {
  const fallbackTaskId = await createMarketTask(
    MARKET_FALLBACK_MODEL,
    userImageUrl,
    garmentImageUrl,
    prompt
  );
  return pollMarketTask(fallbackTaskId);
};

const poll4oTask = async (taskId) => {
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
      return resultUrl;
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
}) => {
  const prompt = buildPrompt(garmentName, garmentDescription);
  const config = PRESET_CONFIG[preset] || PRESET_CONFIG.balanced;

  if (config.type === "gpt4o") {
    try {
      const taskId = await create4oTask(userImageUrl, garmentImageUrl, prompt);
      return poll4oTask(taskId);
    } catch (error) {
      if (isGoogleBillingDisabledError(error)) {
        console.warn("Premium model billing hatasi verdi, market fallback deneniyor.");
        return tryMarketFallback(userImageUrl, garmentImageUrl, prompt);
      }

      throw error;
    }
  }

  try {
    const taskId = await createMarketTask(
      config.model,
      userImageUrl,
      garmentImageUrl,
      prompt,
      config.resolution || "1K"
    );
    return pollMarketTask(taskId);
  } catch (error) {
    if (isGoogleBillingDisabledError(error)) {
      console.warn(
        `Kie market modeli kullanilamadi (${config.model}). Premium fallback deneniyor.`
      );
      try {
        return await tryPremiumFallback(userImageUrl, garmentImageUrl, prompt);
      } catch (premiumError) {
        console.warn("Premium fallback de basarisiz oldu, market fallback deneniyor.");
        return tryMarketFallback(userImageUrl, garmentImageUrl, prompt);
      }
    }

    throw error;
  }
};
