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
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const payload = await readJsonBody(req);
    const { email, name } = payload;

    if (!email || !name) {
      return res.status(400).json({ message: "Email and name are required." });
    }

    const { sendWelcomeEmail } = await import("../../server/emailService.js");
    await sendWelcomeEmail(email, name);

    return res.status(200).json({ success: true, message: "Welcome email sent." });
  } catch (error) {
    console.error("Welcome email route failed:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
