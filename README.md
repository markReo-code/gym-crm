# Turborepo Next.js + Hono Starter

Turborepo をベースにした Next.js + Hono のスターターテンプレートです。

## Tech Stack

- Turborepo
- Next.js 16.2.6
- Hono 4.12
- TypeScript 5.9
- pnpm

## Structure

```txt
apps/
├── web    # Next.js
└── api    # Hono

packages/
├── ui
├── eslint-config
└── typescript-config
```

## Commands

Install dependencies

```bash
pnpm install
```

Run development servers

```bash
pnpm dev
```

Type check

```bash
pnpm check-types
```

Lint

```bash
pnpm lint
```

Build

```bash
pnpm build
```

## Notes

This repository is intended to be used as a starter template for future projects.
