# Markup Validator (Dreamweaver classic)

A classic Adobe Dreamweaver extension that checks the active HTML or XML
document for markup errors and lists them in a dockable panel. Click an issue
to jump to it in Code view.

It installs by copying files into your **user Configuration folder** — no CEP,
no Java, no admin rights, no debug mode.

> The engines (`js-html`, `js-xml`) are practical, dependency-free checks
> written in Dreamweaver's JavaScript. They are **not** a replacement for the
> full Nu HTML Checker.

## Features

- **Markup Validator panel** (`Window → Markup Validator`) — issue list,
  click-to-navigate, green/red status border and status icon.
- **Auto-validate** on idle (default 1.5 s debounce) and/or on save.
- **Options panel** — idle/save triggers, include warnings, treat warnings as
  failures, suppress DOCTYPE warnings. Stored as Dreamweaver preferences with
  the `MarkupValidator_` prefix.
- **Commands** — `Validate Markup` and `Markup Validator Settings`.
- **Insert bar object** — `Favorites → Markup Validator`.

## Install

1. Build the package (see below) or copy straight from `dw-classic/`.
2. Quit Dreamweaver.
3. Merge `Shared/`, `Floaters/`, `Commands/` and `Objects/Favorites/` into your
   user Configuration folder, e.g.
   `%AppData%\Adobe\Dreamweaver_2021\en_US\Configuration\`.
4. **Required:** add the Window menu item to your user
   `Configuration\Menus\menus.xml`. Copying files into `Floaters/` alone does
   not create a menu entry. The snippet (plus optional Commands entries) is in
   [`dw-classic/menus-fragment.xml`](dw-classic/menus-fragment.xml).
5. Start Dreamweaver and open `Window → Markup Validator`.

Full step-by-step instructions, troubleshooting and uninstall steps:
[`dw-classic/INSTALL.txt`](dw-classic/INSTALL.txt).

## Development

Requirements: Node.js (22 is used locally) and Python 3 (for the quality gate).
Dreamweaver is **not** needed to run the tests — `scripts/load-classic-scripts.js`
loads the extension sources into Node with a stubbed `dreamweaver` API.

```bash
npm install
```

### Tests

```bash
./test.sh              # syntax check, smoke test, full test suite
```

### Quality gate

This repo enforces a [Fallow](https://fallow.tools) maintainability gate (dead
code, duplication, complexity, CRAP, maintainability index, health score).

```bash
npm run fallow:gate               # full gate (collects coverage first)
npm run fallow                    # lighter check: dead-code + dupes + complexity
npm run fallow:install-git-hook   # optional pre-commit backstop
```

Policy and remediation: [`docs/fallow/quality-gate.md`](docs/fallow/quality-gate.md),
[`docs/fallow/remediation.md`](docs/fallow/remediation.md).

### Build the release zip

```bash
./scripts/package-classic.sh
# → dist/MarkupValidator-classic-config.zip
```

The zip contains a `Configuration/` tree ready to merge, plus `INSTALL.txt` and
`menus-fragment.xml`. Uses `zip` if available, otherwise falls back to Python.

### Status icons

The panel's 16×16 PNG status icons are generated without dependencies:

```bash
node scripts/gen-status-icons.js
# → dw-classic/Floaters/MarkupValidator/status-{none,busy,ok,fail}.png
```

## Layout

| Path | Role |
|------|------|
| `dw-classic/Shared/MarkupValidator/` | Core: validation engines (`MVValidateHtml*`, `MVValidateXml*`), prefs, navigation, triggers |
| `dw-classic/Floaters/` | Main panel and Options panel (HTML/JS/CSS) |
| `dw-classic/Commands/` | `Validate Markup` and `Markup Validator Settings` commands |
| `dw-classic/Objects/Favorites/` | Insert bar Favorites object |
| `dw-classic/INSTALL.txt`, `menus-fragment.xml` | End-user install docs shipped in the zip |
| `fixtures/` | Valid/invalid HTML and XML samples used by tests |
| `scripts/` | Tests, coverage, packaging, icon generator, Fallow gate |
| `docs/fallow/` | Quality gate policy and remediation guide |
| `.fallow/mi-floor-exceptions.json` | Documented maintainability-index exceptions (tracked) |
| `dist/`, `coverage/` | Generated output (git-ignored) |

## License notices

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
