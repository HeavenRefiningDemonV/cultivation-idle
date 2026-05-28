# Security Audit

## Scope

This is a browser idle game audit focused on local save data, content ingestion, asset loading, unsafe rendering, dependency hygiene, dev/build tooling, and telemetry risk. No behavior-changing security fixes were applied.

Codex Security connector-specific tooling was not exposed in this session, so this report is based on local inspection and `npm audit`.

## Threat model

| Asset | Trust boundary | Risk | Existing mitigation | Gap |
|---|---|---|---|---|
| Save data | browser localStorage | user tampering, stale schema, migration residue | Save/migration services and migration warnings | no cryptographic integrity; acceptable for offline single-player, but corruption recovery should remain robust |
| Content JSON | public content files | malformed content, missing refs, content/runtime drift | `npm run validate:content`, runtime manifest checks | validators do not prove reachability or timing |
| Browser DOM | local app render | unsafe HTML/XSS if untrusted text is injected | scan did not surface high-signal `dangerouslySetInnerHTML`, `eval`, or `new Function` | keep content rendered as text, not HTML |
| External assets | static assets and Vite dev server | broken paths, dev server disclosure | production build succeeds | Vite advisory and unresolved `InsideDungeon.png` warning remain |
| Sentry/telemetry | external telemetry if configured | sensitive payload leakage | no Sentry data accessed in this audit | Sentry env unavailable; source map/payload policy not verified |
| Dependencies | npm supply chain | known advisories | package lock exists | npm audit reports 4 vulnerabilities |

## Findings

| ID | Severity | Title | Evidence | Exploitability | Impact | Suggested remediation |
|---|---|---|---|---|---|---|
| SEC-001 | Medium | Vite dependency has high advisories | `npm audit --audit-level=moderate --json` reported high `vite` advisories | mainly dev-server/local network exposure | release hygiene and local-dev risk | update Vite after compatibility checks; rerun build and dev server smoke |
| SEC-002 | Medium | `@xmldom/xmldom` transitive dependency has high advisories | npm audit reported XML injection/DoS advisory | depends on whether XML parsing is reachable | supply-chain risk | update transitive dependency or parent package |
| SEC-003 | Medium | `postcss` direct dependency has moderate XSS advisory | npm audit reported PostCSS line return parsing advisory | build-time/content dependent | build pipeline risk | update PostCSS to patched range |
| SEC-004 | Low | `brace-expansion` transitive ReDoS advisory | npm audit reported moderate vulnerability | low unless exposed to attacker-controlled patterns | tooling risk | update transitive dependency via parent update |
| SEC-005 | Info | Save data is intentionally local and tamperable | localStorage save keys observed in fresh context after autosave | user-controlled local environment | not a multiplayer/security boundary | treat save corruption as reliability problem, not anti-cheat |
| SEC-006 | Info | Unsafe DOM rendering scan did not find obvious dangerous sinks | source search for `dangerouslySetInnerHTML`, raw `innerHTML`, `eval`, `new Function` | not confirmed exploitable | no high-signal XSS finding in this pass | keep validators and avoid rendering content as HTML |

## Scans run

- `npm audit --audit-level=moderate --json`: failed with 4 vulnerabilities.
- Source search:
  - `dangerouslySetInnerHTML`
  - `innerHTML`
  - `eval(`
  - `new Function`
  - `localStorage`
  - `indexedDB`
  - `JSON.parse`
  - `sanitize`
  - `DOMPurify`
- Build warning review from `npm run build`.

## Release readiness impact

The security findings do not outrank the gameplay/readiness blockers, but dependency updates should land before final menu polish or any public packaging pass. The Vite advisory is especially relevant to local/dev server use.
