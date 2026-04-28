resume_dir := justfile_directory()
opensource_projects_dir := env_var('HOME') / "projects/open-source"
stackoverflow_theme_dir := opensource_projects_dir / "jsonresume-theme-stackoverflow"
portfolio_dir := env_var('HOME') / "projects/personal/portfolio"

# Show available recipes.
[private]
default:
  @just --list --unsorted

# Validate the resume's schema.
validate:
  @npx resume validate resume.json && echo "🔷 Resume JSON schema validation succeeded. 🔷"

# Update the resume's last modified date.
[private]
update-last-modified-date:
  @npx tsx scripts/update-resume-date.ts

# Serve resume at https://localhost:4000/.
serve:
  npm run dev

# Export locally to an HTML file.
export:
  npm run export:html

# Symlink the resume.json file to theme directory.
link:
  ln -sf {{resume_dir}}/resume.json {{stackoverflow_theme_dir}}/resume.json

# Serve resume at https://localhost:4000/ (using locally cloned theme).
serve-local:
  cd {{stackoverflow_theme_dir}} && npm run build
  cd {{stackoverflow_theme_dir}} && npx resume-cli serve -t .

# Export locally to an HTML file (using locally cloned theme).
export-local:
  cd {{stackoverflow_theme_dir}} && npm run build
  cd {{stackoverflow_theme_dir}} && npx resume-cli export resume.html -t .
  mv {{stackoverflow_theme_dir}}/resume.html {{resume_dir}}
  @printf "\n🔷 Moved HTML file to: ./resume.html 🔷\n"
