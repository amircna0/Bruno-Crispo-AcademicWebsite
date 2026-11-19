# Bruno Crispo – Academic Website

A modern, lightweight website for Prof. Bruno Crispo (Department of Information Engineering and
Computer Science, University of Trento), migrated from the original page at
[disi.unitn.it/~crispo](https://disi.unitn.it/~crispo/) and built with [Hugo](https://gohugo.io/).

## What's on the site

- **Home** – profile with a Google Scholar link, news with a pinned open-positions notice, research
  interests, selected publications, scientific events and contact details. (The "Research projects"
  block is hidden here; the projects stay on the Research page.)
- **Research** – research interests (web security, IoT security, behavioural biometrics, adversarial
  learning, mobile security) and funded projects.
- **Publications** – a curated list of selected papers (each labelled Conference or Journal), plus the
  full list built live from [OpenAlex](https://openalex.org/) each time the page loads. The full list is
  split into Conference papers, Journal articles, Books and book chapters, Preprints and Other
  publications, with search. Google Scholar is the fallback.
- **Mentorship** – current and former Ph.D. students, with dissertation titles and co-advisors.

## Technical overview

- Hugo static site: **no theme, no Go modules, no Node** – just Hugo. Layouts are in `layouts/`.
- All content that changes lives in plain text files (`data/`, `content/`, `hugo.toml`), so updating
  the site never means editing HTML.
- The only live part is the full publication list: a small script in the visitor's browser asks the
  public OpenAlex API for the papers. Everything else is generated at build time.
- Responsive, keyboard-accessible and print-friendly. The portrait is resized by Hugo at build time.
- Built and tested with Hugo **0.152.2**.
