// Keep track of highlight elements
let highlightElements = [];

// Listen for color changes from storage
chrome.storage.local.get(["highlightColor"], (result) => {
  currentHighlightColor = result.highlightColor || "#ffff00";
});

// Listen for storage changes to update highlight color
chrome.storage.onChanged.addListener((changes) => {
  if (changes.highlightColor) {
    currentHighlightColor = changes.highlightColor.newValue;
  }
});

document.addEventListener("mouseup", async () => {
  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 0) {
    // Get current highlight color from storage
    const { highlightColor } = await chrome.storage.local.get([
      "highlightColor",
    ]);
    const currentColor = highlightColor || "#ffff00";

    const range = window.getSelection().getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = currentColor;
    span.style.borderRadius = "3px";
    span.style.padding = "2px";
    span.classList.add("web-highlighter-highlight");
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);
    highlightElements.push(span);

    const pageUrl = window.location.href;
    const existing = await chrome.storage.local.get([pageUrl]);
    const highlights = existing[pageUrl] || [];
    highlights.push({
      text: selectedText,
      timestamp: new Date().toISOString(),
      color: currentColor,
    });
    await chrome.storage.local.set({ [pageUrl]: highlights });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "deleteHighlight" && message.index !== undefined) {
    if (highlightElements[message.index]) {
      const span = highlightElements[message.index];
      const parent = span.parentNode;
      const text = document.createTextNode(span.textContent);
      parent.replaceChild(text, span);
      highlightElements.splice(message.index, 1);
    }
  } else if (message.action === "clearAllHighlights") {
    highlightElements.forEach((span) => {
      const parent = span.parentNode;
      const text = document.createTextNode(span.textContent);
      parent.replaceChild(text, span);
    });
    highlightElements = [];
  }
  sendResponse({ success: true });
  return true;
});
