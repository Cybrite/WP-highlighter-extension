document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const result = await chrome.storage.local.get([url]);
  const highlights = result[url] || [];

  const list = document.getElementById("highlightList");
  list.innerHTML = "";

  highlights.forEach(h => {
    const li = document.createElement("li");
    li.textContent = h.text;
    list.appendChild(li);
  });
});
