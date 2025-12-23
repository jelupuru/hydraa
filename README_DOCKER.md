# Docker usage for hydraa

Quick instructions to build, run, and publish Docker images for this project.

## Local build & run

Build the production image locally and run it:

```bash
# Build the image (uses sqlite fallback during build)
docker build --build-arg DATABASE_URL="file:./dev.db" -t jelupuru/hydraa:latest .

# Run with .env file (ensure .env contains DATABASE_URL and other vars)
docker run -p 3000:3000 --env-file .env jelupuru/hydraa:latest

# Or run with explicit environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/dbname" \
  -e NODE_ENV=production \
  jelupuru/hydraa:latest
```

**Note:** The container needs a reachable DATABASE_URL at runtime. Use `docker compose up` for a complete setup with database included.

## Push to Docker Hub

Log in and push the image (replace tags as needed):

```bash
docker login --username jelupuru
docker push jelupuru/hydraa:latest
# optional: push a versioned tag
docker tag jelupuru/hydraa:latest jelupuru/hydraa:2.2.2
docker push jelupuru/hydraa:2.2.2
```

## Docker Compose (Postgres + app + Adminer)

Start the app and a Postgres database using the included `docker-compose.yml`:

```bash
docker compose up --build
```

The compose setup exposes:
- App: http://localhost:3000
- Adminer (DB UI): http://localhost:8080 (DB: `hydraa_db`, User: `hydraa`)

The app service runs `npx prisma migrate deploy` on start. To run migrations manually:

```bash
docker compose run --rm app npx prisma migrate deploy
```

To stop and remove containers:

```bash
docker compose down
```

## GitHub Actions (auto-publish)

The repository includes a workflow at `.github/workflows/docker-publish.yml` that builds and pushes images to Docker Hub as `jelupuru/hydraa` with both `latest` and the `package.json` version tag.

Set these repository secrets in GitHub before pushing to `main`:
- `DOCKERHUB_USERNAME` — your Docker Hub username (e.g. `jelupuru`).
- `DOCKERHUB_TOKEN` — a Docker Hub access token (create on Docker Hub > Account Settings > Security).

## Notes

- Ensure `.env` (local env vars) is configured for production when running the image.
- For development (hot-reload), consider running `npm run dev` locally or ask me to add a `docker-compose.dev.yml`.
