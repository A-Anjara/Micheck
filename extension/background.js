import {
  MAX_TEXT_LENGTH,
  VERDICTS,
  callVerifyApi,
  imageUrlToDataUrl,
} from "./shared.js";

const MENU_TEXT = "micheck-text";
const MENU_IMAGE = "micheck-image";
const MAX_HISTORY = 30;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_TEXT,
      title: "Vérifier ce texte avec Mi-check",
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: MENU_IMAGE,
      title: "Vérifier cette image avec Mi-check",
      contexts: ["image"],
    });
  });
  // Le clic sur l'icône garde la popup ; le panneau s'ouvre depuis les posts.
  chrome.sidePanel?.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
});

const setBadge = (text, color) => {
  chrome.action.setBadgeText({ text });
  if (color) chrome.action.setBadgeBackgroundColor({ color });
};

/** Enregistre la vérification (dernière + historique) dans storage.session. */
async function saveCheck(check, { makeCurrent = true } = {}) {
  const { history = {} } = await chrome.storage.session.get("history");
  history[check.id] = check;
  const ids = Object.keys(history);
  for (const id of ids.slice(0, Math.max(0, ids.length - MAX_HISTORY))) delete history[id];

  const update = { history };
  if (makeCurrent) {
    const { lastCheck } = await chrome.storage.session.get("lastCheck");
    // Ne pas écraser l'affichage si l'utilisateur regarde une vérification plus récente.
    if (!lastCheck || lastCheck.id === check.id || check.status === "loading") {
      update.lastCheck = check;
    }
  }
  await chrome.storage.session.set(update);
}

/** Informe le content script (bouton du post) de l'état d'une vérification. */
function notifyTab(source, check) {
  if (!source?.tabId || !source.postId) return;
  chrome.tabs
    .sendMessage(source.tabId, {
      type: "micheck-status",
      postId: source.postId,
      checkId: check.id,
      status: check.status,
      verdict: check.result?.verdict,
    })
    .catch(() => {});
}

/**
 * Lance une vérification. kind = "text" | "image" | "post" (texte + image).
 * L'état est publié dans storage.session, que la popup et le panneau écoutent.
 */
async function runCheck({ kind, text, imageUrl, image, pageUrl, author, source }) {
  const base = {
    id: crypto.randomUUID(),
    kind,
    author,
    pageUrl,
    preview: text ? text.slice(0, 600) : undefined,
    previewImage: imageUrl || image,
  };
  let check = { ...base, status: "loading" };
  await saveCheck(check);
  notifyTab(source, check);
  setBadge("…", "#0da99b");

  try {
    let payloadImage = image;
    if (!payloadImage && imageUrl) {
      try {
        payloadImage = await imageUrlToDataUrl(imageUrl);
      } catch (err) {
        // Image non décodable localement : on laisse le serveur la récupérer.
        if (!/^https:\/\//i.test(imageUrl)) throw err;
        payloadImage = imageUrl;
      }
    }

    const fullText = text
      ? (author ? `Auteur du post : ${author}\n\n${text}` : text).slice(0, MAX_TEXT_LENGTH)
      : undefined;

    const result = await callVerifyApi({ text: fullText, image: payloadImage, pageUrl });
    check = { ...base, status: "done", result };
    const verdict = VERDICTS[result.verdict] ?? VERDICTS["invérifiable"];
    setBadge(verdict.label.slice(0, 4), verdict.color);
  } catch (err) {
    check = {
      ...base,
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
    setBadge("!", "#d64545");
  }

  await saveCheck(check);
  notifyTab(source, check);
}

/** Doit être appelé de façon synchrone dans le geste utilisateur. */
function openSidePanel(tabId) {
  if (!chrome.sidePanel?.open || !tabId) return;
  chrome.sidePanel.open({ tabId }).catch((err) => {
    console.warn("Mi-check: impossible d'ouvrir le panneau latéral", err);
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.action.openPopup?.().catch(() => {});

  const pageUrl = tab?.url;
  if (info.menuItemId === MENU_TEXT && info.selectionText) {
    runCheck({ kind: "text", text: info.selectionText, pageUrl });
  } else if (info.menuItemId === MENU_IMAGE && info.srcUrl) {
    runCheck({ kind: "image", imageUrl: info.srcUrl, pageUrl });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message?.type) {
    // Depuis la popup
    case "verify":
      runCheck(message.payload);
      break;
    case "clear-badge":
      setBadge("");
      break;

    // Depuis le content script Facebook
    case "open-panel":
      openSidePanel(sender.tab?.id);
      break;
    case "verify-post": {
      const { text, imageUrl, pageUrl, author, postId } = message.payload;
      runCheck({
        kind: "post",
        text,
        imageUrl,
        pageUrl,
        author,
        source: { tabId: sender.tab?.id, postId },
      });
      break;
    }
    case "show-check":
      openSidePanel(sender.tab?.id);
      chrome.storage.session.get("history").then(({ history = {} }) => {
        const check = history[message.checkId];
        if (check) chrome.storage.session.set({ lastCheck: check });
      });
      break;
  }
  sendResponse({ ok: true });
});
