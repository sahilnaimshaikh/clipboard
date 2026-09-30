document.addEventListener("copy", () => {
  const selected = window.getSelection().toString();
  if (selected) {
    chrome.runtime.sendMessage({ type: "CLIPBOARD_COPY", text: selected });
    return;
  }

  const active = document.activeElement;
  if (
    active &&
    (active.tagName === "TEXTAREA" || active.tagName === "INPUT") &&
    typeof active.selectionStart === "number" &&
    active.selectionStart !== active.selectionEnd
  ) {
    const value = active.value.slice(active.selectionStart, active.selectionEnd);
    chrome.runtime.sendMessage({ type: "CLIPBOARD_COPY", text: value });
  }
});
