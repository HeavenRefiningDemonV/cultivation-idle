# MP5 GitHub Actions Artifacts

Generated: 2026-05-29T17:28:20.891Z

- Status: local workflow configured.
- Workflow: `.github/workflows/mp5-release-evidence.yml`.
- Uploads: MP5 markdown/json/log artifacts and browser screenshots.
- The workflow uploads evidence before enforcing the release-gate result, so failed gates preserve artifacts and still fail CI.
- Retention: 30 days.
- Remote CI execution was not verified because `gh` CLI/token access was unavailable.
