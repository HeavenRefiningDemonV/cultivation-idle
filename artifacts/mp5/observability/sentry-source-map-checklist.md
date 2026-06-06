# MP5 Sentry Source Map Checklist

Generated: 2026-05-29T17:28:20.891Z

- Required secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
- Required app config: DSN via env, release name tied to commit/build, environment tag.
- Required build config: production source maps generated/uploaded in CI with private auth token.
- Required privacy rule: no full save files, localStorage dumps, cookies, tokens, or raw personal data in event context.
