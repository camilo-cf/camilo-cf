# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a GitHub special profile README repository (`camilo-cf/camilo-cf`). It renders as the public profile page at https://github.com/camilo-cf. The repo contains no buildable software — it is a Markdown content repository with SVG assets and GitHub Actions automation.

## Repository Structure

- `README.md` — The profile content. Edited directly.
- `metrics.svg` / `metrics-compact.svg` — Generated GitHub metrics visualizations.
- `.github/workflows/` — Automation workflows (see below).
- `PROFILE_GUIDE.md` / `SETUP_CHECKLIST.md` — Legacy documentation from a previous template-based README iteration.

## Common Commands

There are no build, lint, or test commands. Content changes are made by editing `README.md` and pushing to `main`.

```bash
# Edit README.md, then commit and push
git add README.md
git commit -m "Update profile: ..."
git push origin main
```

## Automation Workflows

- `.github/workflows/metrics.yml` — Generates `metrics.svg` and `metrics-compact.svg` every 6 hours using [lowlighter/metrics](https://github.com/lowlighter/metrics). Requires a `METRICS_TOKEN` or `GITHUB_TOKEN` secret.
- `.github/workflows/update-readme.yml` — Auto-updates `README.md` with latest blog posts from `https://camilo-cf.github.io/feed.xml` and recent GitHub activity. Runs hourly. Uses `BLOG-POST-LIST` comment tags to know where to insert content. If the README does not contain these tags, the workflow may append a new section.
- `.github/workflows/snake.yml` — Generates a contribution grid snake animation SVG and pushes it to an `output` branch. No longer referenced in the current README but the workflow still runs.
- `.github/workflows/profile-views.yml` — Generates a profile views badge SVG in `.github/profile-views.svg`. Requires a `TRAFFIC_PAT` secret with `repo` scope. No longer referenced in the current README but the workflow still runs.

## Profile Identity

The README represents Camilo Cáceres as a Staff ML Engineer at MercadoLibre, with a PhD from UNICAMP. The voice is direct and technical — no templates, no decoration over substance, no "currently learning" language. Key brand elements:

- Primary identity: Staff ML Engineer @ MercadoLibre (Display Ads)
- Secondary: PhD (UNICAMP) — Control Theory & Optimization
- Tertiary: Writer / Newsletter author — *Más Allá del Notebook*
- Links: [Substack](https://camilocaceres.substack.com), [Website](https://camilo-cf.github.io), [LinkedIn](https://linkedin.com/in/camilocaceres), [Google Scholar](https://scholar.google.com/citations?user=325XocAAAAAJ&hl=en)

## Editing Guidelines

- Keep the README in single-column Markdown. Avoid `<div align="center">` or heavy HTML.
- Do not add profile view counters, snake animations, class/object code snippets, or "Knowledge Sharer" language.
- The "Selected Projects" table should remain concise (4 projects). Add or swap repos only if they are high-signal.
- Tech stack should be limited to what is actually shipped with. Avoid exhaustive badge lists.
- Do not add generic philosophy quotes or "Let's connect" closings.
