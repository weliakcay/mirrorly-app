import { handleTryOnRequest } from "../server/tryOnService";

const readJsonBody = async (req: any) => {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }

  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({
      success: false,
      imageUrl: "",
      message: "Method not allowed.",
    });
    return;
  }

  const payload = await readJsonBody(req);
  const response = await handleTryOnRequest(payload);

  res.status(response.status).json(response.body);
}
