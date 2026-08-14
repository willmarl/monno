# Bare-metal / PM2 deploy (archived)

These scripts are for the old git-pull + PM2 deploy path documented in
`docs/setup.md` under **deploy (bare metal)**.

Current production path is Docker image deploy:

- Docs: `docs/docker-deploy.md`
- Deploy: `scripts/deploy-images-vm.sh`
- DB backup/restore: `scripts/backup-db.sh`, `scripts/restore-db.sh`

`pnpm run deploy:env` (docker mode) is unchanged and still lives in
`scripts/deploy-env.sh`. Use `pnpm run deploy:env -- bare` only if you still
need the PM2 env layout.
