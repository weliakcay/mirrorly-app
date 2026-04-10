export default {
  async fetch() {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "pong",
      }),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },
};
