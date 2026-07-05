import fs from "node:fs";
import path from "node:path";

// GitHub Actions のイベント情報(JSON)を読み込む
function readGitHubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is not set.");
  }

  return JSON.parse(fs.readFileSync(eventPath, "utf-8"));
}

// PR情報を取得する
function getPullRequest(eventData) {
  const pullRequest = eventData.pull_request;

  if (!pullRequest) {
    throw new Error("This script must be run on a pull_request event.");
  }

  return {
    number: pullRequest.number,
    title: pullRequest.title,
    body: pullRequest.body ?? "",
    baseRef: pullRequest.base.ref,
    headRef: pullRequest.head.ref,
  };
}

// リポジトリ情報(owner / repository名)を取得する
function getRepositoryInfo() {
  const repository = process.env.GITHUB_REPOSITORY;

  if (!repository) {
    throw new Error("GITHUB_REPOSITORY is not set.");
  }

  const [owner, repoName] = repository.split("/");

  if (!owner || !repoName) {
    throw new Error(`Invalid GITHUB_REPOSITORY value: ${repository}`);
  }

  return { owner, repoName };
}

// GitHub APIからPRの変更ファイル一覧を取得する
async function fetchChangedFiles({ owner, repoName, prNumber }) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not set");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch PR files: ${response.status} ${response.statusText}`,
    );
  }

  const files = await response.json();

  return files.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch ?? "",
  }));
}

// 指定ディレクトリ配下のファイルを再帰的に取得する
function walkFiles(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }

    return [fullPath];
  });
}

// 既存のPlaywright E2Eテスト一覧を取得する
function readExistingE2ESpecs() {
  const e2eDir = path.join(process.cwd(), "e2e");

  return walkFiles(e2eDir)
    .filter((filePath) => filePath.endsWith(".spec.ts"))
    .map((filePath) => path.relative(process.cwd(), filePath));
}

// Playwright設定ファイルの内容を文字列として取得する
function readPlaywrightConfig() {
  const configPath = path.join(process.cwd(), "playwright.config.ts");

  if (!fs.existsSync(configPath)) {
    return "";
  }

  return fs.readFileSync(configPath, "utf-8");
}

async function main() {
  const eventData = readGitHubEvent();
  const pullRequest = getPullRequest(eventData);
  const repository = getRepositoryInfo();

  const changedFiles = await fetchChangedFiles({
    owner: repository.owner,
    repoName: repository.repoName,
    prNumber: pullRequest.number,
  });

  const existingE2ESpecs = readExistingE2ESpecs();
  const playwrightConfig = readPlaywrightConfig();

  const context = {
    pullRequest,
    repository,
    changedFiles,
    existingE2ESpecs,
    playwrightConfig,
  };

  console.log(JSON.stringify(context, null, 2));
}

await main();
