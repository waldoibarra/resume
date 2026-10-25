# Pending work

These items remain open in their named repositories.

## This repository

- When resume.json changes, trigger an update of the HTML used on my personal website.

## jsonresume-theme-stackoverflow

- Should not use the `meta.theme` as an object, it is meant to be a string with
  the actual theme to use. But `stackoverflow` theme uses it for its own purposes.
- Change language based on `meta.language`.
- `basics.website` is not in the schema, use `basics.url`.
- Paragraphs on formatted text should add spacing between them.
- Education should have a `highlights` property.
- References are adding a weird space between the quotes.
- Separate education `studyType` from `area`, a dash could work.

## actions-deploy-gist

- Use same commit than the commit from my repo, if possible. Or at least
  preserve the commit message.
