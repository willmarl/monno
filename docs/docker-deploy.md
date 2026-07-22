# Docker deployment: local build → GHCR → VM pull

This is a manual, pull-based workflow for a small VM:

1. Make and commit code changes on the main PC.
2. Build versioned images on the main PC.
3. Push images to GitHub Container Registry (GHCR).
4. SSH into the VM and deploy that exact tag.

There is no GitHub Actions workflow and GitHub has no access to the VM. The VM
never builds application code; it only pulls and runs images.

## Images

One publish creates four images with the same immutable tag:

- `ghcr.io/<owner>/monno-api:<git-sha>`
- `ghcr.io/<owner>/monno-worker:<git-sha>`
- `ghcr.io/<owner>/monno-web:<git-sha>`
- `ghcr.io/<owner>/monno-migrate:<git-sha>`

`migrate` is a one-shot image. It runs `prisma migrate deploy` before api and
worker start.

## One-time: configure GHCR

Create a GitHub classic Personal Access Token:

- Main PC push token: `write:packages` (and `read:packages`)
- VM pull token: `read:packages` only, if packages are private

Login without putting the token in shell history:

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
```

If the four GHCR packages are public, the VM does not need to log in.

## Publish from the main PC

The default image tag is the current short Git commit SHA. Commit first so the
tag identifies the exact source that produced the images.

```bash
export GHCR_OWNER=YOUR_GITHUB_USER
export NEXT_PUBLIC_API_URL=https://api.example.com

pnpm run images:publish
```

The script defaults to `PLATFORM=linux/amd64`. Override it only when the VM uses
a different architecture:

```bash
PLATFORM=linux/arm64 pnpm run images:publish
```

Separate build/push commands are also available:

```bash
pnpm run images:build
pnpm run images:push
```

Optional variables:

```bash
IMAGE_PREFIX=myapp       # default: monno
IMAGE_TAG=v1.2.3         # default: git short SHA
```

The publish output prints the tag to pass to the VM deploy script.

## One-time: prepare the VM deployment folder

The VM only needs Docker, host nginx/certbot, and this small deployment bundle:

```text
/opt/apps/monno/
├── docker-compose.prod.yml
├── .env.prod
├── env/
│   ├── api.env
│   └── worker.env
└── scripts/
    └── deploy-images-vm.sh
```

It is okay to keep a clone of the repository there for convenience; the
production compose file has no `build:` sections and the deploy script uses
`--no-build`, so source code is never compiled on the VM.

Create the files locally (easier to edit in an IDE than on the VM):

```bash
cp .env.prod.template .env.prod
mkdir -p env
cp apps/api/.env.template env/api.env
cp apps/worker/.env.template env/worker.env
```

Fill in `.env.prod`, `env/api.env`, and `env/worker.env`. At minimum:

- `.env.prod`: GHCR owner, image prefix, strong DB password
- `env/api.env`: JWT secrets, production URLs, OAuth/Stripe/email/storage config
- `env/worker.env`: email/storage config

Container networking values (`DATABASE_URL`, Redis host/port, upload path) are
overridden by compose; do not point them at `localhost`.

Upload them with the existing env deploy helper (also copies the compose file +
VM update script):

```bash
# scripts/.env.deploy must have DEPLOY_USER / DEPLOY_HOST / DEPLOY_PATH
pnpm run deploy:env              # docker mode (default)
# pnpm run deploy:env -- bare    # old PM2 layout if you still need it
```

For private GHCR packages, login once on the VM using a read-only token:

```bash
echo "$GHCR_READ_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USER --password-stdin
```

## Deploy or update on the VM

Use the immutable tag printed by `images:publish`:

```bash
cd /opt/apps/monno
bash scripts/deploy-images-vm.sh 7b1bde5
```

The script:

1. Validates deployment env files exist.
2. Pulls all four application images.
3. Starts PostgreSQL/Redis.
4. Runs migrations once.
5. Recreates api/worker/web with the selected images.
6. Prints container status and migration logs.

Host nginx continues proxying:

- `example.com` → `127.0.0.1:3000` (web)
- `api.example.com` → `127.0.0.1:3001` (api)

Only nginx exposes ports 80/443 publicly. The production compose binds web/api
to loopback and does not publish PostgreSQL or Redis.

## Roll back

Images are tagged by commit, so rollback means redeploying an older tag:

```bash
bash scripts/deploy-images-vm.sh PREVIOUS_GIT_SHA
```

Application rollback is immediate. Database migrations are not automatically
reversed; migrations should remain backward-compatible when possible.

## Useful VM commands

```bash
docker compose -p monno-prod --env-file .env.prod -f docker-compose.prod.yml ps
docker compose -p monno-prod --env-file .env.prod -f docker-compose.prod.yml logs -f api
docker compose -p monno-prod --env-file .env.prod -f docker-compose.prod.yml logs -f worker
docker image prune # remove unused old image layers after confirming deployment
```
