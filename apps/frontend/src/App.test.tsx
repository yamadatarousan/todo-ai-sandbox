import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("開発基盤の確認メッセージを表示する", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Todo AI Sandbox" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("開発基盤のセットアップが完了しています。"),
    ).toBeInTheDocument();
  });
});
