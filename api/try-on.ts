export const runtime = "nodejs";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

const readJsonBody = async (request: Request) => {
  const raw = await request.text();
  return raw ? JSON.parse(raw) : {};
};

export default {
  async fetch(request: Request) {
    try {
      if (request.method === "GET") {
        return json({
          success: true,
          message: "Mirrorly try-on API is reachable.",
          runtime,
        });
      }

      if (request.method !== "POST") {
        return json(
          {
            success: false,
            imageUrl: "",
            message: "Method not allowed.",
          },
          405
        );
      }

      const payload = await readJsonBody(request);
      const { handleTryOnRequest } = await import("../server/tryOnService");
      const response = await handleTryOnRequest(payload);

      return json(response.body, response.status);
    } catch (error: any) {
      console.error("API route failed:", error);
      return json(
        {
          success: false,
          imageUrl: "",
          message: error?.message || "Try-on route error.",
        },
        500
      );
    }
  },
};
