# Bruno Crispo – Academic Website

A modern, lightweight website for Prof. Bruno Crispo (Department of Information Engineering and
Computer Science, University of Trento), migrated from the original page at
[disi.unitn.it/~crispo](https://disi.unitn.it/~crispo/) and built with [Hugo](https://gohugo.io/).

## What's on the site

- **Home** – profile with a Google Scholar link, news with a pinned open-positions notice, research
  interests, selected publications, projects and contact details.
- **Research** – research interests (web security, IoT security, behavioural biometrics, adversarial
  learning, mobile security), funded projects and scientific events.
- **Publications** – a curated list of selected papers, plus the full list built live from
  [OpenAlex](https://openalex.org/) each time the page loads, with search. Google Scholar is the fallback.
- **Mentorship** – current and former Ph.D. students, with dissertation titles and co-advisors.

## Technical overview

- Hugo static site: **no theme, no Go modules, no Node** – just Hugo. Layouts are in `layouts/`.
- All content that changes lives in plain text files (`data/`, `content/`, `hugo.toml`), so updating
  the site never means editing HTML.
- The only live part is the full publication list: a small script in the visitor's browser asks the
  public OpenAlex API for the papers. Everything else is generated at build time.
- Responsive, keyboard-accessible and print-friendly. The portrait is resized by Hugo at build time.
- Built and tested with Hugo **0.152.2**.

## Run it on macOS

1. Open **Terminal** (press `Cmd + Space`, type *Terminal*, press Enter).
2. Install Apple's command-line tools: `xcode-select --install`
3. Install [Homebrew](https://brew.sh/) (copy the one-line installer from the website), then:
   ```bash
   brew install hugo git
   ```
4. Get the project and start the local server:
   ```bash
   git clone <repository-url> crispo-website
   cd crispo-website
   hugo server
   ```
5. Open <http://localhost:1313>. The page reloads every time you save a file.
6. Stop the server with `Ctrl + C`. To produce the final site, run `hugo --minify`; the result is in `public/`.

Terminal basics: `pwd` shows where you are, `ls` lists files, `cd folder` enters a folder, `cd ..` goes
up. In Finder, `Cmd + Shift + .` shows hidden files such as `.gitignore`.

## Project map

| Path | What it is |
| --- | --- |
| `hugo.toml` | Site settings: menu, contact details, Google Scholar link, OpenAlex author ID |
| `content/` | One `_index.md` per page (titles; the home page also holds role, intro and keywords) |
| `data/news.yaml` | News items; `pinned: true` keeps an item at the top |
| `data/selected_publications.yaml` | The selected-publications list (home and Publications pages) |
| `data/students.yaml` | Current and former Ph.D. students |
| `data/interests.yaml`, `projects.yaml`, `events.yaml` | Research page content |
| `layouts/` | HTML templates: `baseof.html` (page shell), `partials/` (header, footer, …), one folder per page |
| `assets/` | CSS, the publications script and the portrait; Hugo minifies and fingerprints them |
| `static/_redirects` | Cloudflare redirects (`/supervision` → `/mentorship/`) |

## Everyday tasks

- **Add news** – add a block at the top of `data/news.yaml` (below the pinned item).
- **Final 10 selected papers** – edit `data/selected_publications.yaml`: one block per paper.
- **Move a student** – edit `data/students.yaml`; names awaiting confirmation are listed in the comment at its top.
- **Hide a wrongly attributed paper from the live list** – add its OpenAlex ID to `openalexHide` in `hugo.toml`.
- **Change contact details or the Scholar link** – `hugo.toml`, under `[params]`.

## Deploy on Cloudflare

The file `wrangler.jsonc` tells Cloudflare how to build and publish the site (it runs
`hugo --gc --minify` and publishes the `public/` folder). Connect this repository in
**Workers & Pages → Create → Import a repository** and use:

| Setting | Value |
| --- | --- |
| Project / Worker name | `bruno-crispo-academicwebsite` (must match `name` in `wrangler.jsonc`) |
| Build command | leave empty (`wrangler.jsonc` already contains it) |
| Deploy command | `npx wrangler deploy` |
| Build variable | `HUGO_VERSION` = `0.152.2` (Settings → Build → Variables and secrets) |

Every push to `main` then rebuilds and publishes the site.
