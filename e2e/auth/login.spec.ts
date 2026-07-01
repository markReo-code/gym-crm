import { expect, test } from "@playwright/test";

test.describe("ログイン画面", () => {
  test("ログインフォームが表示される", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "ログイン" })).toBeVisible();

    await expect(page.getByLabel("メールアドレス")).toBeVisible();
    await expect(page.getByLabel("パスワード", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "ログインする" }),
    ).toBeVisible();
  });

  test("空のまま送信するとバリデーションエラーが表示される", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: "ログインする" }).click();

    await expect(
      page.getByText("メールアドレスの形式が正しくありません。"),
    ).toBeVisible();

    await expect(
      page.getByText("パスワードを入力してください。"),
    ).toBeVisible();
  });

  test("パスワード表示を切り替えられる", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByLabel("パスワード", { exact: true });

    await passwordInput.fill("password");

    await expect(passwordInput).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "パスワードを表示" }).click();

    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(
      page.getByRole("button", { name: "パスワードを非表示" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "パスワードを非表示" }).click();

    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(
      page.getByRole("button", { name: "パスワードを表示" }),
    ).toBeVisible();
  });
});
