# Maintain the résumé

Edit `resume.json` locally, validate it, then commit the staged version.
Run these commands from the repository root with Node and `just` installed.

```bash
just setup
just validate
just serve
```

`just setup` installs dependencies.
`just validate` checks the working file, not the staged version.
`just serve` uses the installed StackOverflow theme and serves at `http://localhost:4000/`.
Run `just export` to write `resume.html` locally.

## Commit behavior

The pre-commit hook validates the staged `resume.json` using the installed
`resume-cli`.
A semantic résumé change gets a UTC `meta.lastModified` timestamp before commit.
Changes only to `meta.lastModified` do not trigger a new timestamp.
The hook rejects a changed résumé when its working bytes differ from the
staged bytes.
Stage every résumé edit before committing; partial staging is unsupported.
Validation failures leave the index and working file unchanged.
The hook stages only `resume.json` after stamping; it never amends a commit.
An already-staged timestamp differing from `HEAD` remains unchanged on
repeated hook runs.
Further edits during the same staging cycle retain that timestamp.

A push to `main` that changes `resume.json` triggers the
[gist workflow](../.github/workflows/sync-resume-json-gist.yaml).
That workflow uploads the JSON file to a gist using a configured action and token.
It does not establish when, or whether, the JSON Resume registry updates.
Automatically updating the website's HTML from this repository remains
[pending work](../TODO.md).

## Work with the local theme

The theme repository must exist at `~/projects/open-source/jsonresume-theme-stackoverflow`.
Run `just link` to symlink this repository's `resume.json` into that checkout.
Then run `just serve-local` for preview or `just export-local` for local HTML export.
These recipes build the separate theme checkout and may write outside this repository.
**Legacy local staging:** `just deploy` runs `just export-local`, then moves
`resume.html` to `~/projects/personal/portfolio/public/resume.html`.
It does not publish the website or update the current `/resume` artifact,
`public/resume/index.html`, in the portfolio repository.
The portfolio's `trunk` CI owns production upload and CloudFront invalidation.
A manual invalidation does not replace that deployment.
The recipe's completion message is legacy wording, not publication guidance.
Follow the portfolio's
[deployment guide](https://github.com/waldoibarra/portfolio/blob/trunk/docs/how-to/verify-deployment.md)
for publication and verification.
Review cross-repository effects before running these recipes.
