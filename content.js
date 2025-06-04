document.addEventListener("mouseup", async () => {
  const selectedText = window.getSelection().toString().trim();

  if (selectedText.length > 0) {
    const range = window.getSelection().getRangeAt(0);
    const span = document.createElement("span");
    span.style.backgroundColor = "#ffff00";
    span.style.borderRadius = "3px";
    span.style.padding = "2px";
    span.textContent = selectedText;

    range.deleteContents();
    range.insertNode(span);

    const pageUrl = window.location.href;
    const existing = await chrome.storage.local.get([pageUrl]);
    const highlights = existing[pageUrl] || [];
    highlights.push({ text: selectedText });
    await chrome.storage.local.set({ [pageUrl]: highlights });
  }
});
