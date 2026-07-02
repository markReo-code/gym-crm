# AI E2E Test Generation Design

## Goal

PR差分から追加すべきPlaywright E2Eテスト案を生成し、PRコメントとして提示する。

## Non-Goals

初期段階ではAIによる自動commit、自動spec生成、自動修正は行わない。

## Current State

- Playwright設定: playwright.config.ts
- E2E配置: e2e/
- 既存CI: .github/workflows/playwright.yml
- 対象ブランチ: develop向けPR

## Proposed Flow

1. PR作成/更新
2. GitHub ActionsがPR差分を取得
3. AIに差分、既存E2E一覧、関連画面情報を渡す
4. AIが追加テスト案を生成
5. PRコメントに投稿

## AI Output Format

- 対象機能
- 追加すべきテストケース
- 優先度
- 推奨specファイル
- 注意点
- 自動生成可否

## Security and Permissions

- 初期段階では read-only
- PRコメント投稿権限のみ
- secretsはfork PRで使わない
- AIには必要最小限のdiffだけ渡す

## Roadmap

Phase 1: PRコメント提案
Phase 2: 手動実行可能なspec草案生成
Phase 3: AI生成PR/patch作成
Phase 4: Playwright CIで自動検証
Phase 5: 品質ゲート導入
