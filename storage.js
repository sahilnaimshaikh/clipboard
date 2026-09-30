const STORAGE_KEY = "clipboardHistory";
const TABS_KEY = "clipboardTabs";
const ACTIVE_TAB_KEY = "clipboardActiveTab";
const LINK_REGEX = /^(https?:\/\/|www\.)\S+$/i;

const DEFAULT_TABS = [
  { id: "text", name: "Text", locked: true },
  { id: "kibana", name: "Kibana Filters", locked: true },
];
const DEFAULT_TAB_ID = DEFAULT_TABS[0].id;

function storageGet(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function storageSet(values) {
  return new Promise((resolve) => chrome.storage.local.set(values, resolve));
}

async function getTabs() {
  const result = await storageGet([TABS_KEY]);
  return result[TABS_KEY] && result[TABS_KEY].length ? result[TABS_KEY] : DEFAULT_TABS;
}

function saveTabs(tabs) {
  return storageSet({ [TABS_KEY]: tabs });
}

async function addTab(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const tabs = await getTabs();
  const id = `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  tabs.push({ id, name: trimmed });
  await saveTabs(tabs);
  return id;
}

async function deleteTab(id) {
  const tabs = await getTabs();
  const target = tabs.find((t) => t.id === id);
  if (!target || target.locked || tabs.length <= 1) return false;

  const remaining = tabs.filter((t) => t.id !== id);
  await saveTabs(remaining);

  const items = await getHistory();
  await saveHistory(items.filter((item) => (item.tabId || DEFAULT_TAB_ID) !== id));
  return true;
}

async function getActiveTabId() {
  const result = await storageGet([ACTIVE_TAB_KEY]);
  return result[ACTIVE_TAB_KEY] || DEFAULT_TAB_ID;
}

function setActiveTabId(id) {
  return storageSet({ [ACTIVE_TAB_KEY]: id });
}

async function getHistory() {
  const result = await storageGet([STORAGE_KEY]);
  return result[STORAGE_KEY] || [];
}

function saveHistory(items) {
  return storageSet({ [STORAGE_KEY]: items });
}

async function addHistoryItem(text, tabId, source = "auto", title = "") {
  const trimmed = text.trim();
  if (!trimmed) return;

  const targetTabId = tabId || DEFAULT_TAB_ID;
  const items = await getHistory();
  const top = items[0];
  if (top && top.text === trimmed && (top.tabId || DEFAULT_TAB_ID) === targetTabId) return;

  items.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text: trimmed,
    title: title.trim(),
    tabId: targetTabId,
    isLink: LINK_REGEX.test(trimmed),
    pinned: false,
    source,
    timestamp: Date.now(),
  });

  await saveHistory(items);
}

async function deleteHistoryItem(id) {
  const items = await getHistory();
  await saveHistory(items.filter((item) => item.id !== id));
}

async function togglePinHistoryItem(id) {
  const items = await getHistory();
  const item = items.find((i) => i.id === id);
  if (item) item.pinned = !item.pinned;
  await saveHistory(items);
}

async function clearHistory(tabId) {
  const items = await getHistory();
  await saveHistory(
    items.filter((item) => item.pinned || (item.tabId || DEFAULT_TAB_ID) !== tabId)
  );
}
