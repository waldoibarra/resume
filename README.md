# Resume — Waldo Ibarra

This is basically a fork of Thomas Davis [resume](https://github.com/thomasdavis/resume).

## Installation

```bash
nvm install
npm install
```

## Quick Start

Always validate your resume after making changes:

```bash
npx resume validate resume.json
```

Update the resume (`resume.json`) and render with a theme:

```bash
npx resume serve --theme stackoverflow
```

Export to HTML / PDF:

```bash
# Export to HTML
resume export resume.html --theme stackoverflow

# Export to PDF (not working?)
resume export resume.pdf --theme stackoverflow
```
