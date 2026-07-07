# lcons

A Linux icon browser for Adwaita and KDE Breeze icon themes.

## Why this exists

I was building a Linux app and needed icons for the toolbar buttons. I picked a few that looked good, tested them on KDE, and they worked great. Then I tried GNOME and half of them were missing. So I went looking for icons that worked on both, and that turned out to be way harder than it should be.

The Adwaita and Breeze icon sets are huge, the naming conventions are different, and there's no easy way to see what you've got side by side. I just wanted to find common icons, compare how they look across themes, and grab the paths. So I built this.

## What it does

- Browse 7000+ icons from Adwaita and Breeze themes
- Filter by name, category, and size
- See which icons exist in both themes (the "Common" view shows them side by side)
- Click any icon to see all available sizes and file paths
- Search instantly as you type

## How to use it

The app is live at [lcons.dekomote.com](https://lcons.dekomote.com). Just open it and browse.

If you want to run it locally:

```bash
git clone <repo-url>
cd lcons
bash download-icons.sh
python3 preprocess.py
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Project structure

```
lcons/
  index.html          Main app
  css/styles.css      Brutalist styling
  js/app.js           Core logic
  js/grid.js          Grid rendering
  js/detail.js        Detail modal
  download-icons.sh   Downloads icon repos
  preprocess.py       Scans icons into JSON
  data/               Generated JSON metadata
  icons/              Downloaded icon repos (gitignored)
```

## Licenses

- **Code:** LGPL-3.0 (see LICENSE)
- **Adwaita icons:** CC BY-SA 3.0, by [GNOME](https://gitlab.gnome.org/GNOME/adwaita-icon-theme)
- **Breeze icons:** LGPL-2.1, by [KDE](https://invent.kde.org/frameworks/breeze-icons)
