import { expect, test } from "@playwright/test";

test("Todo の追加から完了切り替えと削除確認まで進められる", async ({
  page,
}) => {
  const todoTitle = createUniqueTodoTitle("E2E 通し確認");

  await page.goto("/");
  await page.getByLabel("新しい Todo").fill(todoTitle);
  await page.getByRole("button", { name: "Todo を追加する" }).click();

  const todoCard = page.locator("li", {
    has: page.getByRole("heading", { name: todoTitle }),
  });

  await expect(todoCard.getByText("未完了")).toBeVisible();

  await todoCard.getByRole("button", { name: "完了にする" }).click();

  await expect(todoCard.locator(".todo-status")).toHaveText("完了");
  await expect(
    todoCard.getByRole("button", { name: "未完了に戻す" }),
  ).toBeVisible();

  await todoCard.getByRole("button", { name: "削除する" }).click();

  const deleteDialog = page.getByRole("dialog");

  await expect(
    deleteDialog.getByRole("heading", { name: "Todo を削除しますか？" }),
  ).toBeVisible();
  await expect(deleteDialog.getByText(todoTitle)).toBeVisible();

  await deleteDialog.getByRole("button", { name: "キャンセル" }).click();

  await expect(deleteDialog).toHaveCount(0);
  await expect(page.getByRole("heading", { name: todoTitle })).toBeVisible();

  await todoCard.getByRole("button", { name: "削除する" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "削除を確定する" })
    .click();

  await expect(page.getByRole("heading", { name: todoTitle })).toHaveCount(0);
});

test("空白だけの Todo は追加できず、原因が表示される", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("新しい Todo").fill("   ");
  await page.getByRole("button", { name: "Todo を追加する" }).click();

  await expect(page.getByText("入力が不正です。")).toBeVisible();
  await expect(
    page.getByText("title は空文字を許可しません。"),
  ).toBeVisible();
});

test("Todo 追加 API が 500 のとき成功表示にしない", async ({ page }) => {
  const failedTodoTitle = createUniqueTodoTitle("E2E 追加失敗");

  await page.route("**/todos", async (route) => {
    const request = route.request();

    if (request.method() !== "POST") {
      await route.fallback();
      return;
    }

    const postData = request.postDataJSON() as { title?: string } | null;

    if (postData?.title !== failedTodoTitle) {
      await route.fallback();
      return;
    }

    await route.fulfill({
      body: JSON.stringify({
        message: "サーバーエラーが発生しました。",
        requestId: "req-playwright-save-500",
      }),
      contentType: "application/json",
      status: 500,
    });
  });

  await page.goto("/");
  await page.getByLabel("新しい Todo").fill(failedTodoTitle);
  await page.getByRole("button", { name: "Todo を追加する" }).click();

  await expect(
    page.getByText("サーバーエラーが発生しました。"),
  ).toBeVisible();
  await expect(
    page.getByText("requestId: req-playwright-save-500"),
  ).toBeVisible();
  await expect(
    page.getByText("保存に失敗したため、一覧は成功扱いに更新していません。"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: failedTodoTitle }),
  ).toHaveCount(0);
});

function createUniqueTodoTitle(prefix: string) {
  return `${prefix} ${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
