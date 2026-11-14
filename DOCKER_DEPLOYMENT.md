# Docker deployment

This guide deploys the LMS on a Linux server with Docker Compose and a domain
name. It assumes the server already has Docker Engine, the Docker Compose
plugin, and a host-level reverse proxy (such as Nginx or Caddy) configured for
HTTPS.

## 1. Get the code

```sh
git clone <your-repository-url> lms
cd lms
```

Run the following commands from the directory containing `docker-compose.yml`.

## 2. Configure backend secrets

Create the backend runtime environment file. Do not commit it or put frontend
secrets in it.

```sh
umask 077
nano backend/.env
```

At minimum, set a unique signing secret and your public site origin:

```dotenv
JWT_SECRET=<long-random-secret>
FRONTEND_URL=https://lms.example.com
```

Generate a strong value and paste it in place of the placeholder:

```sh
openssl rand -hex 32
```

Add any provider-specific settings required by your installation (for example
email, payment, storage, or SSO credentials). See
[OPERATIONS.md](./OPERATIONS.md) for settings and operational requirements.
Keep this file private; the backend container reads it at runtime.

## 3. Configure the database and public frontend settings

For production, provision a secured MongoDB instance, restrict its network
access, and use its authenticated connection URI in `deploy.env`. URL-encode
special characters in the URI username and password. The Compose file requires
`MONGODB_URL`; it will not silently fall back to an unsecured database.

Create the Compose interpolation file:

```sh
nano deploy.env
```

For production, add:

```dotenv
MONGODB_URL=mongodb+srv://<encoded-user>:<encoded-password>@<database-host>/<database-name>?retryWrites=true&w=majority
```

For a disposable local test only, instead set
`MONGODB_URL=mongodb://mongo:27017/lms` in `deploy.env` and start Compose with
`--profile local-db`. This profile uses an unauthenticated MongoDB service;
never use it for production data.

If frontend OAuth client IDs or optional public integration URLs are needed,
add their `VITE_...` variables to this file as well. The supported build
arguments are `VITE_GOOGLE_CLIENT_ID`, `VITE_FACEBOOK_APP_ID`,
`VITE_LINKEDIN_CLIENT_ID`, `VITE_LARAVEL_BASE_URL`,
`VITE_PLAN_API_BASE_URL`, and `VITE_PHP_SITE_URL`. These are embedded in
browser code and **must not contain private credentials**. The production API
base URL defaults to the same-origin `/api/v1`.

Restrict the files and check the Compose configuration:

```sh
chmod 600 backend/.env deploy.env
docker compose --env-file deploy.env config --quiet
```

## 4. Build and start

```sh
docker compose --env-file deploy.env up -d --build
docker compose --env-file deploy.env ps
docker compose --env-file deploy.env logs --tail=100 backend frontend
```

For the local test database, start with:

```sh
docker compose --profile local-db --env-file deploy.env up -d --build
```

The frontend is bound to `127.0.0.1:8080`; the backend and MongoDB have no
published host ports. Configure the host reverse proxy to send HTTPS requests
for `lms.example.com` to `http://127.0.0.1:8080`, preserving the `Host`
header and forwarding `X-Forwarded-Proto` and `X-Forwarded-For`. The included
container Nginx proxies `/api` and `/socket.io/` to the backend.

Set `TRUST_PROXY=true` in `backend/.env` only when this app is behind a trusted
proxy. Allow inbound SSH and HTTPS (and HTTP if needed for certificate
issuance) in the server firewall. Do not expose ports 5001, 5173, or 27017.
Set `FRONTEND_URL` to the exact HTTPS origin users visit.

The health endpoint is proxied to the backend and returns an error when the
database is unavailable:

```sh
curl -fsS http://127.0.0.1:8080/health
```

The health check should report a healthy database connection. The Compose
configuration does not seed data automatically. Only on a new, empty database
that you intend to initialize, run the seed script once:

```sh
docker compose --env-file deploy.env exec backend npm run seed
```

## Operations

```sh
# Follow logs
docker compose --env-file deploy.env logs -f

# Restart after configuration changes
docker compose --env-file deploy.env up -d

# Rebuild after pulling application changes
git pull
docker compose --env-file deploy.env up -d --build

# Stop containers without deleting persistent data
docker compose --env-file deploy.env down
```

Do not use `docker compose --env-file deploy.env down -v` unless you
intentionally want to delete local MongoDB and uploaded-file volumes. Back up
the production MongoDB and the `backend-uploads` volume regularly, and test
restoring those backups.

For production upgrades, review [OPERATIONS.md](./OPERATIONS.md) for required
migrations, checkout/session considerations, schedulers, email workers, and
storage configuration before deploying.
