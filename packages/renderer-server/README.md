# @le-relief/renderer-server

Tiny Express wrapper around `@le-relief/renderer` for Cloud Run / GitHub Actions.

## Local

```bash
pnpm --filter @le-relief/renderer-server dev
# → POST http://localhost:8080/render
```

## Deploy to Cloud Run

```bash
# From repo root:
gcloud builds submit --tag gcr.io/$PROJECT/le-relief-renderer
gcloud run deploy le-relief-renderer \
  --image gcr.io/$PROJECT/le-relief-renderer \
  --region us-central1 \
  --allow-unauthenticated=false \
  --memory 2Gi \
  --cpu 2 \
  --timeout 120 \
  --set-env-vars=RENDERER_AUTH_TOKEN=...,NEXT_PUBLIC_SITE_URL=https://lereliefhaiti.com
```

Then in the Next.js deployment:

```
RENDERER_MODE=cloud-run
RENDERER_URL=https://le-relief-renderer-xxx.a.run.app
RENDERER_AUTH_TOKEN=<same value>
```

## GitHub Action alternative

Build the same Docker image, run it inside an `ubuntu-latest` job, POST to `localhost:8080/render`. Pattern is identical — Cloud Run is just a long-running variant.

## API

`POST /render`

```json
{
  "article": { "id": "...", "title": "...", "body": "...", "slug": "...", "language": "fr" },
  "platforms": ["instagram-feed", "x-portrait"]
}
```

Returns:

```json
{
  "brandName": "Le Relief",
  "warnings": [],
  "platforms": {
    "instagram-feed": {
      "slides": [{ "slideNumber": 1, "pngBase64": "...", "format": "png", "width": 2160, "height": 2700 }],
      "caption": "...",
      "firstComment": "...",
      "thread": null,
      "meta": null
    }
  }
}
```
