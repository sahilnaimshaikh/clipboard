# Clipboard History

A Chrome extension that automatically saves everything you copy so you can search, organize, and reuse it later — with support for custom tabs, titles, pinning, and manual entries.

## Features

- **Auto-save on copy** — copying text or a link on any page saves it to your history automatically.
- **Tabs** — items are organized into tabs. Two built-in tabs (**Text**, **Kibana Filters**) can't be deleted; add your own custom tabs for other categories.
- **Manual add** — click **+** to open a form and type or paste content directly, with an optional title (handy for labeling links so you remember what they point to).
- **Search** — filter the current tab's items by text or title.
- **Pin** — star an item to keep it exempt from "Clear".
- **Click-to-copy** — click any item (or its copy icon) to copy it back to your clipboard.
- **Delete / Clear** — remove individual items, or clear all unpinned items in a tab (with a confirmation prompt).
- **Local-only storage** — everything stays in `chrome.storage.local` on your machine; nothing is synced or sent anywhere.

## Installation (load unpacked)

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select this project folder.
5. The extension icon will appear in your toolbar.

## How to use it

### Saving something automatically
Just copy any text or link on any webpage (Cmd/Ctrl+C, or right-click → Copy). It's saved to the **Text** tab instantly — no extra steps.

### Viewing your history
Click the extension icon in the toolbar to open the popup and see your saved items, most recent first (pinned items always float to the top).

### Adding something manually
1. Click the **+** button in the popup header.
2. (Optional) Give it a title — useful for links, e.g. "Prod Kibana dashboard".
3. Type or paste the content into the text box.
4. Click **Save**.

### Organizing with tabs
- Switch tabs by clicking their name in the tab bar.
- Click **+** at the end of the tab bar to create a custom tab (e.g. "Snippets", "SQL Queries").
- Custom tabs can be deleted via the **✕** on the tab (this also deletes all items in that tab) — you'll be asked to confirm. The built-in **Text** and **Kibana Filters** tabs cannot be deleted.

### Copying something back
Click anywhere on an item (or its copy icon) to copy its content to your clipboard. A toast notification confirms the copy. Paste it wherever you need with Cmd/Ctrl+V.

### Pinning, deleting, and clearing
- Click the **☆** icon on an item to pin it (it turns into **★** and moves to the top, protected from "Clear").
- Click the **✕** icon on an item to delete just that item.
- Click **Clear** in the toolbar to remove all unpinned items in the current tab — you'll be asked to confirm first.

### Searching
Type into the search box to filter the current tab's items by their text or title.

## Project structure

| File | Purpose |
|---|---|
| `manifest.json` | Chrome extension manifest (Manifest V3) |
| `content.js` | Runs on every page; detects copy events and forwards the copied text |
| `background.js` | Service worker; receives copy events and saves them to storage |
| `storage.js` | Shared storage helpers (tabs, history items, pin/delete/clear) used by both the background worker and the popup |
| `popup.html` / `popup.css` / `popup.js` | The popup UI you see when clicking the toolbar icon |

## Privacy

All data is stored locally via `chrome.storage.local` and never leaves your browser. The extension requests only the `storage` permission and content-script access needed to detect copy events on pages.
