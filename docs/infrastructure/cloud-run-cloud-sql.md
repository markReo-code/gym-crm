# Cloud Run x Cloud SQL 接続手順

## 目的

Cloud Run 上で動作する `gym-crm-api` から、Cloud SQL PostgreSQL に接続できるようにする。

最終確認として、以下のエンドポイントで DB 接続成功を確認する。

```bash
curl https://<cloud-run-url>/health/db
```

期待値:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## 全体構成

![Cloud Run と Cloud SQL の接続構成](cloud-run-cloud-sql.png)

## 前提

| 項目               | 値                     |
| ------------------ | ---------------------- |
| Project ID         | `gym-crm-dev`          |
| Region             | `asia-northeast1`      |
| Cloud Run service  | `gym-crm-api`          |
| Cloud SQL instance | `gym-crm-postgres`     |
| Database           | `gym_crm`              |
| Database user      | `gym_crm_app`          |
| Secret name        | `gym-crm-database-url` |

## 作成したリソース

### Cloud SQL

| 項目            | 値                 |
| --------------- | ------------------ |
| Database engine | PostgreSQL 16      |
| Instance ID     | `gym-crm-postgres` |
| Region          | `asia-northeast1`  |
| Edition         | Enterprise         |
| Preset          | Sandbox            |
| Availability    | Single zone        |

### Database

```text
gym_crm
```

### Database User

```text
gym_crm_app
```

アプリケーションから Cloud SQL に接続するための専用ユーザー。

## 接続方式

Cloud Run から Cloud SQL へは、Cloud SQL connection を使って接続する。

Cloud Run に Cloud SQL instance を紐付けると、コンテナ内に以下の Unix socket が用意される。

```text
/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

今回の socket path:

```text
/cloudsql/gym-crm-dev:asia-northeast1:gym-crm-postgres
```

Cloud Run 上の API は、この Unix socket 経由で Cloud SQL PostgreSQL に接続する。

## Connection Name の取得

Cloud SQL の connection name を確認する。  
Connection Name は Cloud SQL インスタンスを一意に識別する「住所」のようなもの。

```bash
gcloud sql instances describe gym-crm-postgres \
  --project=gym-crm-dev \
  --format='value(connectionName)'
```

結果:

```text
gym-crm-dev:asia-northeast1:gym-crm-postgres
```

## Cloud Run の Service Account 確認

Cloud Run service が使用している service account を確認する。

```bash
gcloud run services describe gym-crm-api \
  --project=gym-crm-dev \
  --region=asia-northeast1 \
  --format='value(spec.template.spec.serviceAccountName)'
```

結果 (例):

```text
<project-number>-compute@developer.gserviceaccount.com
```

または、独自の Service Account を利用している場合は、以下のような形式になる。

```text
<cloud-run-service-account>@<project-id>.iam.gserviceaccount.com
```

## Cloud Run に Cloud SQL 接続権限を付与

Cloud Run の service account に `roles/cloudsql.client` を付与する。

```bash
gcloud projects add-iam-policy-binding gym-crm-dev \
  --member='serviceAccount:<cloud-run-service-account>' \
  --role='roles/cloudsql.client'
```

この権限がないと、Cloud Run から Cloud SQL に接続できない。

## Cloud Run に Cloud SQL instance を紐付ける

Cloud Run service に Cloud SQL instance を追加する。

```bash
gcloud run services update gym-crm-api \
  --project=gym-crm-dev \
  --region=asia-northeast1 \
  --add-cloudsql-instances=gym-crm-dev:asia-northeast1:gym-crm-postgres
```

## DATABASE_URL

Cloud Run は `DATABASE_URL` を利用して Cloud SQL へ接続する。
`DATABASE_URL` には、接続ユーザー、パスワード、Database 名、Cloud SQL の接続先が含まれている。

Cloud Run + Cloud SQL Unix socket 接続では、以下の形式を使う。

```text
postgresql://USER:PASSWORD@localhost/DB_NAME?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

今回の形式:

```text
postgresql://gym_crm_app:<password>@localhost/gym_crm?host=/cloudsql/gym-crm-dev:asia-northeast1:gym-crm-postgres
```

`<password>` は Git にコミットしない。Secret Manager に保存する。

パスワードに `@`, `/`, `:`, `#`, `?`, `&` などの URL 上で特別な意味を持つ文字が含まれる場合は、URL encode が必要。

## DATABASE_URL を一時的に環境変数へ設定

Secret Manager に登録するため、ローカル shell 上で一時的に `DATABASE_URL` を設定する。

```bash
export DATABASE_URL='postgresql://gym_crm_app:<password>@localhost/gym_crm?host=/cloudsql/gym-crm-dev:asia-northeast1:gym-crm-postgres'
```

確認:

```bash
echo "$DATABASE_URL"
```

確認後、実際の password を含む値を terminal やログに残しすぎないように注意する。

## Secret Manager に Secret を作成

`DATABASE_URL` を保存する Secret を作成する。

```bash
gcloud secrets create gym-crm-database-url \
  --project=gym-crm-dev \
  --replication-policy=automatic
```

## Secret Manager に DATABASE_URL を登録

Secret に `DATABASE_URL` の値を version として追加する。

```bash
printf "%s" "$DATABASE_URL" | gcloud secrets versions add gym-crm-database-url \
  --project=gym-crm-dev \
  --data-file=-
```

Secret の値を変更したい場合は、既存 Secret を作り直すのではなく、新しい version を追加する。

## Cloud Run に Secret Manager 読み取り権限を付与

Cloud Run の service account に Secret Manager の読み取り権限を付与する。

```bash
gcloud secrets add-iam-policy-binding gym-crm-database-url \
  --project=gym-crm-dev \
  --member='serviceAccount:<cloud-run-service-account>' \
  --role='roles/secretmanager.secretAccessor'
```

この権限がないと、Cloud Run の revision 起動時に `DATABASE_URL` を Secret Manager から読み取れない。

## Cloud Run に DATABASE_URL Secret を設定

Cloud Run service に Secret Manager の値を環境変数 `DATABASE_URL` として渡す。

```bash
gcloud run services update gym-crm-api \
  --project=gym-crm-dev \
  --region=asia-northeast1 \
  --update-secrets=DATABASE_URL=gym-crm-database-url:latest
```

## Prisma migrate / seed

今回のブランチでは、Cloud Run から Cloud SQL に接続できることを `/health/db` で確認した。

Cloud SQL 上に schema や初期データを作成する場合は、次の順番で実行する。

1. `prisma migrate deploy`
2. `prisma db seed`
3. API から Cloud SQL 上のデータ取得を確認

本番相当の DB に対しては `prisma migrate dev` ではなく、`prisma migrate deploy` を使う。

例:

```bash
DATABASE_URL="$DATABASE_URL" pnpm --filter @repo/db prisma migrate deploy
```

seed が必要な場合:

```bash
DATABASE_URL="$DATABASE_URL" pnpm --filter @repo/db prisma db seed
```

## 動作確認

Cloud Run URL の `/health/db` を確認する。

```bash
curl https://<cloud-run-url>/health/db
```

成功:

```json
{
  "status": "ok",
  "database": "connected"
}
```

## トラブルシューティング

### Permission denied on secret

Cloud Run の service account に Secret Manager の読み取り権限がない。

対応:

```bash
gcloud secrets add-iam-policy-binding gym-crm-database-url \
  --project=gym-crm-dev \
  --member='serviceAccount:<cloud-run-service-account>' \
  --role='roles/secretmanager.secretAccessor'
```

### password authentication failed for user "gym_crm_app"

`DATABASE_URL` に設定した password と、Cloud SQL の `gym_crm_app` ユーザーの password が一致していない。

対応:

1. Cloud SQL の `gym_crm_app` password を再設定する
2. `DATABASE_URL` を作り直す
3. Secret Manager に新しい version を追加する
4. Cloud Run を `--update-secrets` で再更新する

### Cloud SQL instance に接続できない

Cloud Run に Cloud SQL instance が紐付いていない、または Cloud Run の service account に `roles/cloudsql.client` がない可能性がある。

確認:

```bash
gcloud run services describe gym-crm-api \
  --project=gym-crm-dev \
  --region=asia-northeast1
```

Cloud SQL 権限を再付与:

```bash
gcloud projects add-iam-policy-binding gym-crm-dev \
  --member='serviceAccount:<cloud-run-service-account>' \
  --role='roles/cloudsql.client'
```

Cloud SQL instance を再設定:

```bash
gcloud run services update gym-crm-api \
  --project=gym-crm-dev \
  --region=asia-northeast1 \
  --add-cloudsql-instances=gym-crm-dev:asia-northeast1:gym-crm-postgres
```

## 今回確認したこと

この検証では、Cloud Run から Cloud SQL PostgreSQL へ接続し、Prisma migration と seed を適用したうえで、API から Cloud SQL 上のデータを取得できることを確認した。

確認した内容:

1. Cloud Run service と Cloud SQL instance の接続
2. Secret Manager 経由での `DATABASE_URL` 管理
3. `prisma migrate deploy` による Cloud SQL への schema 適用
4. 必要に応じた `prisma db seed` の実行
5. `/health/db` による DB 接続確認
6. `/members` API による Cloud SQL 上のデータ取得確認

## 補足

Cloud Run の設定を変更すると、新しい Revision が作成される。

Cloud SQL 接続や Secret の設定変更も Revision 単位で管理されるため、設定変更後は Cloud Run が再デプロイされる。

このドキュメントには実際の DB password は記載しない。

Secret Manager に登録した値を変更したい場合は、Secret の新しい version を追加し、Cloud Run の revision を更新して反映する。

## Cloud SQL の料金と学習用途での扱い

Cloud SQL はインスタンスを起動している間、クエリ量が少なくても CPU・メモリなどの料金が継続して発生する。停止するとインスタンス料金は停止するが、ストレージ、バックアップ、IP アドレスなど一部の料金は継続する。

今回の構成では、Cloud Run と Cloud SQL の接続、Secret Manager 経由の `DATABASE_URL` 管理、Prisma migration の適用、Cloud Run からの DB 接続確認までを学習目的で検証した。

検証が完了し、継続して Cloud SQL を利用する予定がない場合は、不要な課金を避けるために Cloud SQL instance を停止または削除する。削除する場合は、必要に応じて事前に `pg_dump` などでバックアップを取得する。

再度 Cloud SQL を利用する場合は、このドキュメントの手順に沿って Cloud SQL instance、database、user、Secret Manager、Cloud Run 接続設定を作成し、`prisma migrate deploy` を再実行する。
