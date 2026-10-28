# SEED Lab — UCLA Semel Institute

Website for the **SEED Laboratory** (Signatures of Early Emergence and Divergence), led by Brittany Wolff, Ph.D., at the UCLA Jane & Terry Semel Institute for Neuroscience and Human Behavior.

Plain static HTML/CSS/JS — no build step, no animation libraries. Open any `.html` file through a local server (e.g. `python3 -m http.server`).

## Where to change what

| I want to change… | Edit |
| --- | --- |
| Colors, fonts, dark mode | `assets/css/theme.css` |
| Lab email, address, nav links, funders | `assets/js/data.js` → **1. SITE** |
| Contact people (name, role, email) | `assets/js/data.js` → **2. CONTACTS** |
| Team members, alumni, publications, news | `assets/js/data.js` → **3–6** |
| The forked-paths visual (speed, hover, names on Team page) | `assets/js/strings.js` → **SETTINGS / PRESETS** at the top |
| Header, footer, logo mark | `assets/js/main.js` → sections **2–4** |
| Shared styles (buttons, header, footer, cards) | `assets/css/base.css` (numbered sections) |
| Styles for one page | `assets/css/pages.css` (search the page name, e.g. `CONTACT`) |
| Page text | the page's `.html` file |

Each CSS/JS file starts with a table of contents.

After changing CSS or JS, bump `?v=8` in the `<link>`/`<script>` tags of the pages so browsers load the new version.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home — interactive strings hero, central question, what SEED stands for, six methods, PI, latest publications + news, join-a-study band |
| `research.html` | Question, model diagram, methods, current projects, key terms, funding |
| `team.html` | PI feature, filterable member grid with bio pop-up, alumni (names on the strings) |
| `publications.html` | Searchable, filterable list grouped by year |
| `news.html` | News card grid |
| `participate.html` | Join a study — steps, FAQ, study interest form |
| `resources.html` | Crisis info (988) and trusted links for families |
| `contact.html` | Topic chooser, contact people with copy buttons, visit card |
| `join.html` | Redirects to `participate.html` |

## Before launch

- The study interest form opens the visitor's email app (`mailto:`). Swap it for the lab's secure intake form (e.g. REDCap) — see `main.js` section 9.
- Replace text marked as placeholder (shown highlighted in copper on the site), the PI portrait, and `assets/logo/seed-lab-og.png` (link-preview image, still the old logo).

The previous version of the site is kept in `archive/v1/`.
