# eco-build-pilot-3

ECO Build pilot site (release demo): a plain static status page (HTML/CSS/JS, no build step).
The page renders its sections from `content.json` and its changelog from `changelog.json`.

## Deployment

- DEV: `develop` is served at https://tetheree-inc.github.io/eco-build-pilot-3/dev/
- PROD: `main` is served at https://tetheree-inc.github.io/eco-build-pilot-3/
- Deploy (`.github/workflows/pages.yml`) runs on every push to `main` or `develop` and publishes both branches as one GitHub Pages site.
- Deployments to the `github-pages` environment wait for the Eco Build Gate.
- CI (`.github/workflows/ci.yml`) runs on every push and pull request.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000/.
