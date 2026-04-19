## how to setup dev environment

_assumes you have Node 24+, pnpm, and docker installed_

1. `git clone https://github.com/willmarl/monno.git`
2. in `docker-compose.yml` file, replace name "monno" to what your app name is
3. rename the `.env.template` files without the template in file name (ex: `env.local.template` -> `.env.local`)
4. modify the 5 env files to fit your name and details like storage, oauth, resend, etc
   here are the locations of the 5 env files

- `.env.docker`
- `apps/api/.env.template`
- `apps/worker/.env.template`
- `apps/web/.env.local.template`
- `apps/web/.env.production.template`

### Next steps whilst in root project

5. `pnpm i` _fair warning: the install downloads ~6GB_
6. `pnpm run db:up`
7. `pnpm run db:migrate` to run prisma migrations and generate in both `apps/api` and `apps/worker`
8. `pnpm run dev` to launch all apps instance in same terminal
   > i personally dont like it too much, i just have seperate terminal for each app <br>
   > `cd apps/api` `pnpm run dev`

reminder swagger docs exists | http://localhost:3001/docs

## how to run integration tests

### Setup test database (one-time)

1. Copy test env template:

   ```bash
   cp apps/api/.env.test.template apps/api/.env.test
   ```

2. Start test database containers (runs on different ports than dev):
   ```bash
   pnpm run db:test:up
   ```

### Run integration tests

```bash
pnpm run test:integration
```

Tests will run against the isolated test database. The test database is automatically reset before each test run by the global setup (see `apps/api/src/test-utils/global-setup.ts`).

### Cleanup

To stop test containers:

```bash
pnpm run db:test:down
```

### Troubleshooting

If you're having issues setting up the project (build errors, missing dependencies, etc.), the easiest fix is to do a clean reinstall:

```bash
cd /home/johndoe/myrepos/monno

# Remove all build caches and dependencies
rm -rf node_modules .pnpm-store pnpm-lock.yaml
rm -rf apps/*/node_modules apps/*/.next apps/*/dist

# Force reinstall all dependencies
pnpm install --force
```

This removes all cached dependencies and lock files, then reinstalls everything fresh. This usually resolves:

- Build errors
- Missing modules
- Environment variable loading issues
- Docker connectivity problems

### Optional environment variables

Not all environment variables are required if you're not using that service. For example, if you plan on using local storage, you don't need to fill in S3 configs.
Dont want/need to use Oauth, posthog, stripe, or sentry? then can omit from env files. Except for resend just fill with dummy string if not using it.

reminder if omitting then to remove/not use its respective service/components ex:

- oauth components on frontend
- have stripe env set to false on frontend `.env`s
  If not wanting to use email
- replace resend config to dummy strings

```ini
RESEND_API_KEY=foo
RESEND_FROM_EMAIL=foo
RESEND_FROM_NAME=foo
```

- modify `user.service.ts` and `password-reset.service.ts` to not send email job

## how to build/deploy

### reminder of env vars to change before deploying

#### `apps/api/.env`

**URLs & Base Configuration:**

- `BASE_URL=http://localhost:3001` -> `https://api.yourdomain.com`
- `FRONTEND_URL=http://localhost:3000` -> `https://yourdomain.com`
- `*_TOKEN_SECRET` ->

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'));"
```

**Storage:**

- `STORAGE_BACKEND=local` -> Change to `s3` if using cloud storage

**Monitoring & Analytics:**

- `SENTRY_ENV=development` -> Change to `production` or `staging`
- `SENTRY_RELEASE=local` -> Change to actual version (e.g., `1.0.0`)
- `SENTRY_DSN` -> Use production Sentry project DSN
- `POSTHOG_PROJECT_API_KEY` -> Use production PostHog key (optional)

**Admin Seeding:** : use secure password

**Rate Limiting:**

- All `THROTTLE_*_LIMIT` to realistic limits (e.g., `STRICT=5`, `NORMAL=10`, `LENIENT=20`)

**OAuth & Third-party:**

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` -> Production OAuth credentials
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` -> Production OAuth credentials
- Update redirect URLs to production domain

#### `apps/web/.env.production`

**URLs & Base Configuration:**

- `NEXT_PUBLIC_API_URL="http://localhost:3001"`-> `https://api.yourdomain.com`
- `NEXT_PUBLIC_STRIPE_ENABLED`
- `NEXT_PUBLIC_SENTRY_ENVIRONMENT=development` -> `staging` or `production`
  > can omit posthog and sentry if you dont want to use them

#### `apps/worker/.env`

- double check resend info
- if not using email service just fill leave it with dummy strings
- if not using email and session clean up, then can omit running worker service
  > assumes you dont have other modules/service files sending job to worker

### build

in root project just run

```bash
pnpm run build
```

or alternatively just go into each app individually and run `pnpm run build`

### deploy (bare metal)

> _All steps from here on out assumes you have port forward/ingress rules for port 80 and 443 TCP aswell set up your DNS to have your VM's IP to point to your domain name in cloudflare or whatever_

#### 1. prep VM with node, docker, nginx, etc. i have script that installs all software thats needed, just provide your public SSH key.

**[startup.sh](./scripts/startup.sh) does the following:**

- updates and upgrades all system packages
- installs curl, git, and ufw (firewall)
- create `devs` group
- creates `/opt/apps` directory owned by root:devs with read/write for the group
- creates a new user `devuser` and adds to `devs` group
- sets up SSH key authentication for `devuser` with public SSH key provided
- installs node via NVM, pnpm, and pm2
- installs docker and adds users: `ubuntu` and `devuser` to docker group (so can Docker without sudo)
- installs nginx and certbot
- installs UFW opening ports for SSH and nginx

> recommend converting it to cloud init script when creating instance

#### 2. clone repo

```bash
cd `/opt/apps/`
git clone your-repo
cd monno # or whatever your repo/app name is
mkdir logs
pnpm install
```

#### 3. start docker and load prisma migrations

```bash
pnpm run db:up
pnpm run db:migrate
```

#### 4. reminder to set env, secret token, and Oauth

if you setup `scripts/.env.deploy` then can conveniently `scp` files to VM by doing `pnpm run deploy:env`
it will send over `.env` files thats currently in project to their respective `/apps/*` location

- API `apps/api/.env`
- Worker `apps/worker/.env`
- Frontend `apps/web/.production` only
- Deploy `scripts/.env.deploy`

##### Example of what env should have before sending over env files to VM

- `api.example.com` → 123.456.0.789
- `example.com` → 123.456.0.789
- `www.example.com` → 123.456.0.789
- **API env**

```ini
BASE_URL=https://api.example.com
FRONTEND_URL=https://example.com
```

- **Frontend env**

```ini
NEXT_PUBLIC_API_URL="https://api.example.com"
```

##### OAuth changes

**google**
https://console.cloud.google.com/apis/credentials

- Under **Authorized redirect URIs**, add `https://api.example.com/auth/google/callback` (make sure it matches your env in `apps/api`)

**github**
https://github.com/settings/developers

- **Application name**: whatever you want to call it
- **Homepage URL**: `https://example.com` (your frontend)
- **Authorization callback URL**: `https://api.example.com/auth/github/callback` (make sure it matches your env in `apps/api`)

#### 5. build apps

```bash
cd /opt/apps/monno
pnpm run build
```

#### 6. start pm2 with ecosystem config

```bash
pm2 start scripts/ecosystem.config.js
pm2 save
pm2 startup # Follow the output to enable auto-start
```

##### sanity check

test if u can reach backend and frontend

```bash
curl localhost:3000
curl localhost:3001
```

#### 7. nginx setup

using [nginx.template](./scripts/nginx.template), replace the example.com with your actual domain.

```bash
# Copy template to nginx sites folder
sudo cp scripts/nginx.template /etc/nginx/sites-enabled/example.com

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable your site
sudo ln -s /etc/nginx/sites-available/example.com /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

##### sanity check

test if u can reach backend and frontend with domain (no HTTP**S** just HTTP) <br>
http://example.com/<br>
http://api.example.com/

#### 8. add certbot certs

```bash
sudo certbot --nginx -d example.com -d www.example.com -d api.example.com
```

Follow the prompts:

- Enter email
- Agree to terms

then test

```bash
# Should redirect to HTTPS
curl http://example.com
curl https://example.com
curl https://api.example.com
```

#### finish with deploy setup

website should be live

anytime you update repo, SSH into VM and go to project location

```bash
cd /opt/apps/monno
pnpm run deploy:vm
```

should setup DB backup by adding backup script to cron job

#### to backup DB

[backup-db.sh](./scripts/backup-db.sh) works by using `pg_dump` command inside the postgres docker, compress that file, then save in backs up folder. The script automatically reads your `COMPOSE_PROJECT_NAME` from `.env.docker` to determine the correct container name.

1. Optionally change the variables in script file to customize backup location or retention:

```bash
BACKUP_DIR="/opt/apps/monno/backups"
DB_USER="postgres"
DB_NAME="appdb"
KEEP_DAYS=7
```

The container name is automatically derived from `COMPOSE_PROJECT_NAME` in `.env.docker`, so no manual configuration needed there.

2. enable script by `chmod +x scripts/backup-db.sh`
3. Test backup manually first
   `bash /opt/apps/monno/scripts/backup-db.sh`
4. Check it worked
   `ls -lh /opt/backups/backup-*.sql.gz`
5. Add to cron

```bash
sudo crontab -e

# add this then exit cron
0 2 * * * bash /opt/apps/monno/scripts/backup-db.sh >> /opt/backups/backup.log 2>&1

#verify cron is set
sudo crontab -l
```

Note this only saves locally. recommend to have cron job to `rsync` backups to your NAS or some other storage place

#### to restore DB

[restore-db.sh](./scripts/restore-db.sh) works by unzipping file you gave in argument, drops current database, creates fresh database, restore from backup file, then restart `api` and `worker` in pm2.

1. enable script first by `chmod +x scripts/restore-db.sh`
2. Usage: `scripts/restore-db.sh <backup-file>`
   Example: `scripts/restore-db.sh /opt/apps/monno/backups/backup-2026-03-15_140000.sql.gz`
