import { createApp } from "./createApp";

describe("createApp", () => {
  it("開発基盤確認用の health check を返す", async () => {
    const app = createApp();

    const response = await app.inject({
      method: "GET",
      url: "/health",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
    });
  });
});
