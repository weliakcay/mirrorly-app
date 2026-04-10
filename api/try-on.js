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
