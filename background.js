importScripts("storage.js");

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CLIPBOARD_COPY") {
    addHistoryItem(message.text);
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
