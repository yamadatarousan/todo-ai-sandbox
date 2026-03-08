import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptFilePath = fileURLToPath(import.meta.url);
const scriptDirectoryPath = dirname(scriptFilePath);
const packageJsonPath = resolve(scriptDirectoryPath, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const requiredNodeVersion = packageJson.engines?.node;
const requiredNpmVersion = packageJson.engines?.npm;
const actualNodeVersion = process.version.replace(/^v/, "");
const actualNpmVersion = readNpmVersionFromUserAgent(
  process.env.npm_config_user_agent,
);

const mismatchLines = [];

if (requiredNodeVersion && actualNodeVersion !== requiredNodeVersion) {
  mismatchLines.push(
    `- Node.js: 期待値は v${requiredNodeVersion} ですが、現在は v${actualNodeVersion} です。`,
  );
}

if (requiredNpmVersion && actualNpmVersion && actualNpmVersion !== requiredNpmVersion) {
  mismatchLines.push(
    `- npm: 期待値は ${requiredNpmVersion} ですが、現在は ${actualNpmVersion} です。`,
  );
}

if (mismatchLines.length > 0) {
  const lifecycleEvent = process.env.npm_lifecycle_event ?? "npm command";

  console.error(
    [
      `標準実行環境と異なるため \`${lifecycleEvent}\` を中止しました。`,
      "",
      `期待する環境: Node.js v${requiredNodeVersion}, npm ${requiredNpmVersion}`,
      `現在の環境: Node.js v${actualNodeVersion}, npm ${actualNpmVersion ?? "不明"}`,
      "",
      ...mismatchLines,
      "",
      "このまま backend 系の処理を続けると、better-sqlite3 のネイティブモジュール不整合で失敗します。",
      "対処:",
      "- 新しい login shell を開くか、現在の shell で `exec zsh -l` を実行する",
      "- `node -v` と `npm -v` が期待値になったことを確認する",
      "- `npm install` を実行して依存関係を標準環境でそろえる",
      "- その後で元のコマンドを再実行する",
    ].join("\n"),
  );

  process.exit(1);
}

function readNpmVersionFromUserAgent(userAgent) {
  if (!userAgent) {
    return undefined;
  }

  const npmVersionMatch = userAgent.match(/\bnpm\/([0-9.]+)/);

  return npmVersionMatch?.[1];
}
