import { renderCheck } from "./render.js";

const resultEl = document.getElementById("result");
const emptyEl = document.getElementById("empty");

function render(check) {
  emptyEl.hidden = Boolean(check);
  renderCheck(resultEl, check);
}

chrome.storage.session.get("lastCheck").then(({ lastCheck }) => render(lastCheck));
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.lastCheck) render(changes.lastCheck.newValue);
});
