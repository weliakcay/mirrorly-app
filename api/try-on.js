async function readJsonBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

// Best-effort IP rate limit (per-instance, sicak-instance omru boyunca). Naif
// script-flood'u yavaslatir; garment ID'leri public oldugu icin bir butigin tum
// kredisi + Kie butcesi bu endpoint dovulerek yakilabilir.
// NOT: Serverless cok-instance oldugu icin bu TAM koruma DEGIL — uretimde Upstash
// Redis veya Vercel WAF ile IP+merchant tavani eklenmeli (bkz. RELEASE_CHECKLIST).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 6;
const rateHits = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (rateHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateHits.set(ip, recent);
  if (rateHits.size > 5000) rateHits.clear(); // bellek guvenligi
  return recent.length > RATE_MAX;
}

function clientIp(req) {
  const xff = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "";
  return String(xff).split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.status(200).json({
        success: true,
        message: "Mirrorly try-on API is reachable.",
      });
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        success: false,
        imageUrl: "",
        message: "Method not allowed.",
      });
      return;
    }

    if (isRateLimited(clientIp(req))) {
      res.status(429).json({
        success: false,
        imageUrl: "",
        message: "Cok fazla istek. Lutfen biraz bekleyip tekrar dene.",
      });
      return;
    }

    const payload = await readJsonBody(req);
    const { handleTryOnRequest } = await import("../server/tryOnService.js");
    const response = await handleTryOnRequest(payload);

    res.status(response.status).json(response.body);
  } catch (error) {
    console.error("API route failed:", error);
    res.status(500).json({
      success: false,
      imageUrl: "",
      message: error?.message || "Try-on route error.",
    });
  }
}
