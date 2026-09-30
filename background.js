importScripts("storage.js");

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "CLIPBOARD_COPY") {
    addHistoryItem(message.text);
  }
});
