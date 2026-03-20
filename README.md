# Resume — Waldo Ibarra

This is basically a fork of Thomas Davis [resume](https://github.com/thomasdavis/resume).

## Installation

```bash
nvm install
npm install
```

## Quick Start

Update the resume (`resume.json`) and render with a theme:

```bash
npm run dev
```

Export to HTML:

```bash
npm run export:html
```

## Updates

Always validate the resume JSON schema and update the **last modified** property on the `resume.json`:

```bash
npm run validate
npm run update
```
