document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const result = await chrome.storage.local.get([url]);
  let highlights = result[url] || [];

  const list = document.getElementById("highlightList");
  const searchBox = document.getElementById("searchBox");
  const colorSelector = document.getElementById("colorSelector");
  const exportBtn = document.getElementById("exportBtn");
  const clearAllBtn = document.getElementById("clearAllBtn");

  // Load saved color preference
  chrome.storage.local.get(["highlightColor"], (result) => {
    if (result.highlightColor) {
      colorSelector.value = result.highlightColor;
    }
  });

  // Save color preference when changed
  colorSelector.addEventListener("change", () => {
    chrome.storage.local.set({ highlightColor: colorSelector.value });
  });

  function renderHighlights(items) {
    list.innerHTML = "";

    if (items.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "empty-state";
      emptyState.textContent = "No highlights found on this page";
      list.appendChild(emptyState);
      return;
    }

    items.forEach((h, index) => {
      const li = document.createElement("li");

      const textContainer = document.createElement("div");
      textContainer.className = "highlight-text";
      textContainer.textContent = h.text;

      if (h.timestamp) {
        const timestamp = document.createElement("div");
        timestamp.className = "timestamp";
        timestamp.textContent = new Date(h.timestamp).toLocaleString();
        textContainer.appendChild(timestamp);
      }

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "×";
      deleteBtn.title = "Delete highlight";
      deleteBtn.addEventListener("click", async () => {
        highlights.splice(index, 1);
        await chrome.storage.local.set({ [url]: highlights });
        renderHighlights(highlights);

        // Remove highlight from page
        chrome.tabs.sendMessage(tab.id, {
          action: "deleteHighlight",
          index: index,
        });
      });

      li.appendChild(textContainer);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  }

  // Initial render
  renderHighlights(highlights);

  // Search functionality
  searchBox.addEventListener("input", () => {
    const query = searchBox.value.toLowerCase();
    const filtered = highlights.filter((h) =>
      h.text.toLowerCase().includes(query)
    );
    renderHighlights(filtered);
  });

  // Export functionality
  exportBtn.addEventListener("click", () => {
    const data = JSON.stringify(highlights, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "highlights-export.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  // Clear all functionality
  clearAllBtn.addEventListener("click", async () => {
    if (
      confirm("Are you sure you want to clear all highlights on this page?")
    ) {
      await chrome.storage.local.set({ [url]: [] });
      highlights = [];
      renderHighlights(highlights);

      // Clear highlights from page
      chrome.tabs.sendMessage(tab.id, {
        action: "clearAllHighlights",
      });
    }
  });
});
