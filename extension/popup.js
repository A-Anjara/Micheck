import { DEFAULT_API_URL, blobToDataUrl, getApiUrl } from "./shared.js";
import { renderCheck } from "./render.js";

const $ = (id) => document.getElementById(id);
const textInput = $("text-input");
const imageInput = $("image-input");
const imagePreview = $("image-preview");
const dropzone = $("dropzone");
const verifyBtn = $("verify");
const resultEl = $("result");

let activeTab = "text";
let imageDataUrl = null;

// --- Onglets ---------------------------------------------------------------
function selectTab(tab) {
  activeTab = tab;
  document.querySelectorAll(".tabs button").forEach((btn) => {
    btn.setAttribute("aria-selected", String(btn.dataset.tab === tab));
  });
  $("panel-text").hidden = tab !== "text";
  $("panel-image").hidden = tab !== "image";
}
document.querySelectorAll(".tabs button").forEach((btn) => {
  btn.addEventListener("click", () => selectTab(btn.dataset.tab));
});

// --- Sélection de la page --------------------------------------------------
$("grab-selection").addEventListener("click", async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? "",
    });
    if (result?.trim()) {
      textInput.value = result.trim();
    } else {
      textInput.placeholder = "Aucun texte sélectionné sur la page.";
    }
  } catch {
    textInput.placeholder = "Impossible de lire cette page (page système ?).";
  }
});

// --- Image -----------------------------------------------------------------
async function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) return;
  imageDataUrl = await blobToDataUrl(file);
  imagePreview.src = imageDataUrl;
  imagePreview.hidden = false;
  $("dropzone-hint").hidden = true;
}
imageInput.addEventListener("change", () => loadImage(imageInput.files[0]));
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  loadImage(e.dataTransfer.files[0]);
});

// --- Vérification ----------------------------------------------------------
verifyBtn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const pageUrl = tab?.url?.startsWith("http") ? tab.url : undefined;

  if (activeTab === "text") {
    const text = textInput.value.trim();
    if (!text) return textInput.focus();
    chrome.runtime.sendMessage({ type: "verify", payload: { kind: "text", text, pageUrl } });
  } else {
    if (!imageDataUrl) return imageInput.click();
    chrome.runtime.sendMessage({
      type: "verify",
      payload: { kind: "image", image: imageDataUrl },
    });
  }
});

// --- Rendu du résultat -----------------------------------------------------
function render(check) {
  verifyBtn.disabled = check?.status === "loading";
  renderCheck(resultEl, check);
}

// --- Paramètres --------------------------------------------------------------
const apiInput = $("api-url");
getApiUrl().then((url) => (apiInput.value = url));
$("save-api").addEventListener("click", async () => {
  const value = apiInput.value.trim() || DEFAULT_API_URL;
  await chrome.storage.sync.set({ apiUrl: value });
  apiInput.value = value.replace(/\/+$/, "");
});

// --- Initialisation -----------------------------------------------------------
chrome.storage.session.get("lastCheck").then(({ lastCheck }) => {
  render(lastCheck);
  if (lastCheck?.kind === "image") selectTab("image");
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "session" && changes.lastCheck) render(changes.lastCheck.newValue);
});
chrome.runtime.sendMessage({ type: "clear-badge" });
