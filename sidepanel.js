const tabsEl = document.getElementById("tabs");
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const clearAllEl = document.getElementById("clearAll");
const addBtnEl = document.getElementById("addBtn");
const addFormEl = document.getElementById("addForm");
const addTitleEl = document.getElementById("addTitle");
const addTextEl = document.getElementById("addText");
const addCancelEl = document.getElementById("addCancel");
const toastEl = document.getElementById("toast");

let allItems = [];
let allTabs = [];
let activeTabId = null;
let addingTab = false;
let toastTimer = null;

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 1400);
}

function renderTabs() {
  tabsEl.innerHTML = "";

  for (const tab of allTabs) {
    const btn = document.createElement("button");
    btn.className = "tab-btn" + (tab.id === activeTabId ? " active" : "");
    btn.dataset.id = tab.id;

    const label = document.createElement("span");
    label.textContent = tab.name;
    btn.append(label);

    if (!tab.locked) {
      const closeBtn = document.createElement("span");
      closeBtn.className = "tab-close";
      closeBtn.textContent = "✕";
      closeBtn.title = "Delete tab (and its items)";
      btn.append(closeBtn);
    }

    tabsEl.append(btn);
  }

  const newTabBtn = document.createElement("button");
  newTabBtn.id = "newTabBtn";
  newTabBtn.className = "tab-btn tab-new";
  newTabBtn.title = "Add custom tab";
  newTabBtn.textContent = "+";
  tabsEl.append(newTabBtn);

  if (addingTab) {
    const form = document.createElement("form");
    form.className = "new-tab-form";
    form.innerHTML = `
      <input id="newTabName" type="text" placeholder="Tab name..." autofocus />
      <button type="submit">Add</button>
      <button type="button" id="newTabCancel">✕</button>
    `;
    tabsEl.append(form);
    document.getElementById("newTabName").focus();
  }
}

function render() {
  const query = searchEl.value.trim().toLowerCase();
  const inTab = allItems.filter((item) => (item.tabId || allTabs[0]?.id) === activeTabId);
  const filtered = query
    ? inTab.filter(
        (item) =>
          item.text.toLowerCase().includes(query) ||
          (item.title && item.title.toLowerCase().includes(query))
      )
    : inTab;

  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.timestamp - a.timestamp;
  });

  listEl.innerHTML = "";
  emptyEl.hidden = sorted.length > 0;

  for (const item of sorted) {
    const li = document.createElement("li");
    li.className = "item" + (item.pinned ? " pinned-item" : "");
    li.dataset.id = item.id;

    const textWrap = document.createElement("div");
    textWrap.className = "item-text-wrap";

    if (item.title) {
      const titleEl = document.createElement("div");
      titleEl.className = "item-title";
      titleEl.textContent = item.title;
      textWrap.append(titleEl);
    }

    const textEl = document.createElement("div");
    textEl.className = "item-text" + (item.isLink ? " link" : "");
    textEl.textContent = item.text;
    textWrap.append(textEl);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.title = "Copy to clipboard";
    copyBtn.textContent = "⧉";

    const pinBtn = document.createElement("button");
    pinBtn.className = "pin-btn" + (item.pinned ? " pinned" : "");
    pinBtn.title = item.pinned ? "Unpin" : "Pin";
    pinBtn.textContent = item.pinned ? "★" : "☆";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.title = "Delete";
    deleteBtn.textContent = "✕";

    actions.append(copyBtn, pinBtn, deleteBtn);
    li.append(textWrap, actions);
    listEl.append(li);
  }
}

async function refresh() {
  [allItems, allTabs, activeTabId] = await Promise.all([
    getHistory(),
    getTabs(),
    getActiveTabId(),
  ]);
  if (!allTabs.some((t) => t.id === activeTabId)) {
    activeTabId = allTabs[0].id;
    await setActiveTabId(activeTabId);
  }
  renderTabs();
  render();
}

async function copyItem(li, item) {
  await navigator.clipboard.writeText(item.text);
  li.classList.add("copied");
  setTimeout(() => li.classList.remove("copied"), 700);
  showToast("Copied to clipboard");
}

listEl.addEventListener("click", async (event) => {
  const li = event.target.closest(".item");
  if (!li) return;
  const id = li.dataset.id;
  const item = allItems.find((i) => i.id === id);
  if (!item) return;

  if (event.target.classList.contains("pin-btn")) {
    await togglePinHistoryItem(id);
    await refresh();
    return;
  }

  if (event.target.classList.contains("delete-btn")) {
    await deleteHistoryItem(id);
    await refresh();
    return;
  }

  await copyItem(li, item);
});

searchEl.addEventListener("input", render);

clearAllEl.addEventListener("click", async () => {
  const tab = allTabs.find((t) => t.id === activeTabId);
  const ok = confirm(`Clear all unpinned items in "${tab.name}"?`);
  if (!ok) return;

  await clearHistory(activeTabId);
  await refresh();
});

tabsEl.addEventListener("click", async (event) => {
  if (event.target.id === "newTabBtn") {
    addingTab = true;
    renderTabs();
    return;
  }

  if (event.target.id === "newTabCancel") {
    addingTab = false;
    renderTabs();
    return;
  }

  if (event.target.classList.contains("tab-close")) {
    const tabBtn = event.target.closest(".tab-btn");
    const id = tabBtn.dataset.id;
    const tab = allTabs.find((t) => t.id === id);
    const ok = confirm(`Delete tab "${tab.name}" and all its items?`);
    if (ok) {
      await deleteTab(id);
      await refresh();
    }
    return;
  }

  const tabBtn = event.target.closest(".tab-btn");
  if (tabBtn && tabBtn.dataset.id) {
    activeTabId = tabBtn.dataset.id;
    await setActiveTabId(activeTabId);
    renderTabs();
    render();
  }
});

tabsEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.target.classList.contains("new-tab-form")) return;

  const input = document.getElementById("newTabName");
  const name = input.value.trim();
  if (!name) return;

  const id = await addTab(name);
  addingTab = false;
  activeTabId = id;
  await setActiveTabId(activeTabId);
  await refresh();
});

function toggleAddForm(show) {
  addFormEl.hidden = !show;
  addBtnEl.classList.toggle("active", show);
  if (show) addTitleEl.focus();
}

addBtnEl.addEventListener("click", () => {
  toggleAddForm(addFormEl.hidden);
});

addCancelEl.addEventListener("click", () => {
  toggleAddForm(false);
  addTitleEl.value = "";
  addTextEl.value = "";
});

addFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = addTextEl.value.trim();
  if (!text) return;

  await addHistoryItem(text, activeTabId, "manual", addTitleEl.value);
  addTitleEl.value = "";
  addTextEl.value = "";
  toggleAddForm(false);
  await refresh();
});

refresh();
