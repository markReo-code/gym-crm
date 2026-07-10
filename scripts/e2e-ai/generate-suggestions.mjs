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

// GitHub APIで使うトークンを取得する
function getGitHubToken() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error("GITHUB_TOKEN is not set.");
  }

  return token;
}

// GitHub APIからPRの変更ファイル情報(diff・patch含む)を取得する
async function fetchChangedFiles({ owner, repoName, prNumber }) {
  const token = getGitHubToken();

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

// AIに渡すプロンプトテンプレートを読み込む
function readPromptTemplate() {
  const promptPath = path.join(
    process.cwd(),
    "scripts",
    "e2e-ai",
    "prompts",
    "e2e-suggestion.md",
  );

  if (!fs.existsSync(promptPath)) {
    throw new Error("Prompt template not found.");
  }

  return fs.readFileSync(promptPath, "utf-8");
}

// OpenAI APIへPRコンテキストを送信し、E2Eテスト提案を生成する
async function generateE2ESuggestions({ context, prompt }) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.1",
      instructions: prompt,
      input: JSON.stringify(context, null, 2),
      max_output_tokens: 3000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI API request failed: ${response.status}
        ${response.statusText}\n${errorBody}`,
    );
  }

  return response.json();
}

// OpenAI APIのレスポンスからAIが生成したテキストを取得する
function extractOutputText(response) {
  if (response.output_text) {
    return response.output_text;
  }

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      ?.filter((content) => content.type === "output_text")
      ?.map((content) => content.text)
      ?.join("\n") ?? ""
  );
}

const COMMENT_MARKER = "<!-- e2e-ai-suggestions -->";

function buildCommentBody(suggestionMarkdown) {
  return `${COMMENT_MARKER}

## Playwright E2Eテスト提案

${suggestionMarkdown}`;
}

// AI提案をPull Requestのコメントとして投稿する
async function createPullRequestComment({ owner, repoName, prNumber, body }) {
  const token = getGitHubToken();

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to create PR comment: ${response.status}  ${response.statusText}\n${errorBody}`,
    );
  }

  return response.json();
}

// Pull Requestに投稿済みのコメント一覧を取得する
async function fetchPullRequestComments({ owner, repoName, prNumber }) {
  const token = getGitHubToken();

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to fetch PR comments: ${response.status}${response.statusText}\n${errorBody}`,
    );
  }

  return response.json();
}

// Pull Requestに投稿済みのコメントを更新する
async function updatePullRequestComment({ owner, repoName, commentId, body }) {
  const token = getGitHubToken();

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/issues/comments/${commentId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Failed to update PR comment: ${response.status} ${response.statusText}\n${errorBody}`,
    );
  }

  return response.json();
}

// AI提案コメントが既にあれば更新し、なければ新規作成する
async function upsertPullRequestComment({ owner, repoName, prNumber, body }) {
  const comments = await fetchPullRequestComments({
    owner,
    repoName,
    prNumber,
  });

  const existingComment = comments.find((comment) =>
    comment.body?.includes(COMMENT_MARKER),
  );

  if (existingComment) {
    return updatePullRequestComment({
      owner,
      repoName,
      commentId: existingComment.id,
      body,
    });
  }

  return createPullRequestComment({
    owner,
    repoName,
    prNumber,
    body,
  });
}

// GitHub Actions全体の処理を実行する
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

  // OpenAIへ渡すPRコンテキストを作成する
  const context = {
    pullRequest,
    repository,
    changedFiles,
    existingE2ESpecs,
    playwrightConfig,
  };

  const prompt = readPromptTemplate();

  // OpenAI APIへPRコンテキストを送信する
  const aiResponse = await generateE2ESuggestions({
    context,
    prompt,
  });

  // AIが生成したMarkdown形式の提案を取得する
  const suggestionMarkdown = extractOutputText(aiResponse);

  if (!suggestionMarkdown) {
    throw new Error("OpenAI response did not include output text.");
  }

  console.log(suggestionMarkdown);

  await upsertPullRequestComment({
    owner: repository.owner,
    repoName: repository.repoName,
    prNumber: pullRequest.number,
    body: buildCommentBody(suggestionMarkdown),
  });
}

await main();
