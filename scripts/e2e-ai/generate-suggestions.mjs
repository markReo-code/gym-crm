import fs from "node:fs";

function getPullRequestNumber() {
  // GitHub Actions が自動で設定するイベントJSONのパス
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is not set.");
  }
  // GITHUB_EVENT_PATH からイベントデータを取得
  const eventData = JSON.parse(fs.readFileSync(eventPath, "utf-8"));

  // PR番号を取得
  const prNumber = eventData.pull_request
    ? eventData.pull_request.number
    : null;

  if (!prNumber) {
    throw new Error("This script must be run on a pull_request event.");
  }

  return prNumber;
}

const prNumber = getPullRequestNumber();

console.log(`Pull Request Number: ${prNumber}`);

// リポジトリ情報を取得（例: "markReo-code/gym-crm"）
const repository = process.env.GITHUB_REPOSITORY;

if (!repository) {
  throw new Error("GITHUB_REPOSITORY is not set.");
}

// owner と repository 名に分割
const [owner, repoName] = repository.split("/");

console.log(`Owner: ${owner}`);
console.log(`Repository: ${repoName}`);

async function fetchChangedFiles({ owner, repoName, prNumber }) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not set.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/files`,
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

  return response.json();
}

const changedFiles = await fetchChangedFiles({ owner, repoName, prNumber });

console.log(
  changedFiles.map((file) => ({
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
  })),
);
