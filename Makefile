## ╔════════════════════════════════════════════════════════════════════╗
## ║                  See the README.md file for usage                  ║
## ╚════════════════════════════════════════════════════════════════════╝

RESUME_DIR := $(shell pwd)
OPENSOURCE_PROJECTS_DIR := $(HOME)/projects/open-source
STACKOVERFLOW_THEME_DIR := $(OPENSOURCE_PROJECTS_DIR)/jsonresume-theme-stackoverflow

.SILENT:
.ONESHELL:

help: ## Show this help.
	@sed -ne '/@sed/!s/## //p' $(MAKEFILE_LIST)

link: ## Symlink the resume.json file to theme directory.
	ln -sf $(RESUME_DIR)/resume.json $(STACKOVERFLOW_THEME_DIR)/resume.json

serve: ## Serve resume at https:localhost:4000/.
	cd $(STACKOVERFLOW_THEME_DIR)
	npm run build
	npx resume-cli serve -t .

export: ## Export localy to an HTML file.
	cd $(STACKOVERFLOW_THEME_DIR)
	npm run build
	npx resume-cli export resume.html -t .
	mv resume.html $(RESUME_DIR)
	printf "\n🔷 Moved HTML file to: ./resume.html 🔷\n"
