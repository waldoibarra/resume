# Resume — Waldo Ibarra

This is a repository to have my JSON resume, with some automations.

See it deployed here:

- My personal website: [https://waldoibarra.com/resume.html](https://waldoibarra.com/resume.html)
- The JSON registry, loaded from my gist: [https://registry.jsonresume.org/waldoibarra](https://registry.jsonresume.org/waldoibarra) (probably broken)

> This is based on Thomas Davis [resume](https://github.com/thomasdavis/resume) repo.

## Automations

When the [resume.json](resume.json) file changes, it updates a gist on my account; that triggers
an update of the HTML version of it on the JSON resume registry.

## Setup

Install dependencies.

```bash
npm install
```

## Themes

The resume is currently only using the `StackOverflow` theme.

## Quick Start

Update the resume (`resume.json`) and serve it.

```bash
just serve
```

Export to HTML.

```bash
just export
```

## Use Local Theme Updates

Clone the theme repository and symlink the JSON resume.

```bash
mkdir -p ~/projects/open-source/
git clone git@github.com:phoinixi/jsonresume-theme-stackoverflow.git ~/projects/open-source/jsonresume-theme-stackoverflow
just link
```

Serve and export the resume.

```bash
just serve-local
just export-local
```
