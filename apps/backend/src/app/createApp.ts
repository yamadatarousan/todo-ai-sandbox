import Fastify from "fastify";

export function createApp() {
  const app = Fastify();

  // 開発基盤の確認用に、最小の応答を返す。
  app.get("/health", async () => {
    return {
      status: "ok",
    };
  });

  return app;
}
