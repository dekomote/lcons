#!/usr/bin/env bash

WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICONS_DIR="$WORK_DIR/icons"

mkdir -p "$ICONS_DIR"

echo "Downloading Adwaita icons"
if [ -d "$ICONS_DIR/adwaita-icon-theme" ]; then
  echo "Adwaita already cloned, pulling latest..."
  git -C "$ICONS_DIR/adwaita-icon-theme" pull --ff-only || true
else
  git clone --depth 1 https://gitlab.gnome.org/GNOME/adwaita-icon-theme.git "$ICONS_DIR/adwaita-icon-theme"
fi

echo ""
echo "Downloading Breeze icons"
if [ -d "$ICONS_DIR/breeze-icons" ]; then
  echo "Breeze already cloned, pulling latest..."
  git -C "$ICONS_DIR/breeze-icons" pull --ff-only || true
else
  git clone --depth 1 https://invent.kde.org/frameworks/breeze-icons.git "$ICONS_DIR/breeze-icons"
fi

echo ""
echo "Cleaning up Adwaita"
ADWAITA="$ICONS_DIR/adwaita-icon-theme"
# Keep only the Adwaita/ directory, remove everything else
find "$ADWAITA" -maxdepth 1 -not -path "$ADWAITA" -not -name "Adwaita" -not -name ".git" -exec rm -rf {} +
rm -rf "$ADWAITA/.git"
echo "Kept: Adwaita/"

echo ""
echo "Cleaning up Breeze"
BREEZE="$ICONS_DIR/breeze-icons"
# Keep only the icons/ directory, remove everything else
find "$BREEZE" -maxdepth 1 -not -path "$BREEZE" -not -name "icons" -not -name ".git" -exec rm -rf {} +
rm -rf "$BREEZE/.git"
echo "Kept: icons/"

echo ""
echo "Done"
echo "Adwaita: $ADWAITA/Adwaita"
echo "Breeze:  $BREEZE/icons"
echo ""
echo "Run 'python3 preprocess.py' to generate icon data."
