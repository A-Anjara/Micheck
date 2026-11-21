// Mi-check — détection des posts Facebook et bouton « Vérifier ».
// Le DOM de Facebook est obfusqué et change souvent : on s'appuie sur des
// attributs d'accessibilité / data-* plutôt que sur des classes CSS.
(() => {
  if (window.__micheckLoaded) return;
  window.__micheckLoaded = true;

  const POST_SELECTORS = [
    "div[aria-posinset]", // posts du fil d'actualité
    '[data-pagelet^="FeedUnit"]',
    'div[role="feed"] > div',
    'div[role="article"]', // groupes, pages, post seul
  ].join(",");

  const MESSAGE_SELECTORS = [
    '[data-ad-preview="message"]',
    '[data-ad-comet-preview="message"]',
    '[data-ad-rendering-role="story_message"]',
  ].join(",");

  const AUTHOR_SELECTORS = [
    '[data-ad-rendering-role="profile_name"]',
    "h2 strong",
    "h3 strong",
    "h4 strong",
    "h2 a",
    "h3 a",
    "h4 a",
  ].join(",");

  const SEE_MORE = /^(en )?voir plus$|^afficher la suite$|^see more$/i;
  const COMMENT_LABEL = /^(comment|commentaire|réponse|reply)/i;
  const MIN_TEXT = 15;
  const MIN_IMAGE_SIDE = 180;

  const VERDICTS = {
    vrai: { label: "Plutôt vrai", color: "#2e9d4f" },
    faux: { label: "Faux", color: "#d64545" },
    trompeur: { label: "Trompeur", color: "#e08a2c" },
    "invérifiable": { label: "Invérifiable", color: "#7a7a7a" },
  };

  /** postId -> { button, checkId } */
  const buttons = new Map();
  let counter = 0;

  // --- Extraction du contenu ------------------------------------------------

  /** Vrai si le nœud appartient à un commentaire du post (et non au post). */
  function isInComment(node, post) {
    for (let p = node; p && p !== post; p = p.parentElement) {
      if (p.getAttribute?.("role") === "article" && COMMENT_LABEL.test(p.getAttribute("aria-label") || "")) {
        return true;
      }
      if (p.tagName === "UL" || p.tagName === "FORM") return true;
    }
    return false;
  }

  function getPostText(post) {
    const messages = [...post.querySelectorAll(MESSAGE_SELECTORS)].filter((m) => !isInComment(m, post));
    let text = messages.map((m) => m.innerText.trim()).join("\n").trim();

    if (!text) {
      // Repli : blocs de texte « dir=auto » hors en-tête, liens, boutons et commentaires.
      const parts = [...post.querySelectorAll('div[dir="auto"], span[dir="auto"]')].filter(
        (n) =>
          !isInComment(n, post) &&
          !n.closest('h2, h3, h4, a, [role="button"], [contenteditable="true"]') &&
          !n.parentElement?.closest('[dir="auto"]'),
      );
      text = [...new Set(parts.map((n) => n.innerText.trim()).filter((t) => t.length > 20))].join("\n");
    }
    return text.replace(/\n{3,}/g, "\n\n");
  }

  function getPostImage(post) {
    let best = null;
    let bestArea = 0;
    for (const img of post.querySelectorAll("img")) {
      if (!img.src?.startsWith("http") || isInComment(img, post)) continue;
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      if (w < MIN_IMAGE_SIDE || h < MIN_IMAGE_SIDE) continue; // avatars, emojis…
      if (w * h > bestArea) {
        best = img.currentSrc || img.src;
        bestArea = w * h;
      }
    }
    return best;
  }

  function getAuthor(post) {
    const node = [...post.querySelectorAll(AUTHOR_SELECTORS)].find((n) => !isInComment(n, post));
    return node?.innerText.trim().split("\n")[0] || undefined;
  }

  function getPermalink(post) {
    const link = post.querySelector(
      'a[href*="/posts/"], a[href*="/permalink/"], a[href*="story_fbid"], a[href*="/photo"], a[href*="/videos/"]',
    );
    if (!link) return location.href;
    try {
      const url = new URL(link.href);
      url.search = url.search.includes("story_fbid") ? url.search : "";
      return url.toString();
    } catch {
      return location.href;
    }
  }

  /** Déplie « En voir plus » pour récupérer le texte complet. */
  function expandSeeMore(post) {
    let clicked = false;
    for (const btn of post.querySelectorAll('div[role="button"], span[role="button"]')) {
      if (SEE_MORE.test(btn.innerText.trim()) && !isInComment(btn, post)) {
        btn.click();
        clicked = true;
      }
    }
    return clicked;
  }

  // --- Bouton -------------------------------------------------------------------

  const BUTTON_CSS = `
    :host { all: initial; position: absolute; top: 12px; right: 96px; z-index: 3; }
    button {
      display: inline-flex; align-items: center; gap: 6px; cursor: pointer;
      font: 700 12px/1 system-ui, -apple-system, "Segoe UI", sans-serif;
      padding: 6px 11px; border-radius: 999px; border: 0; color: #0d1a10;
      background: linear-gradient(90deg, #0da99b, #6cc671);
      box-shadow: 0 1px 4px rgba(0,0,0,.25); transition: transform .1s, filter .1s;
    }
    button:hover { filter: brightness(1.08); transform: translateY(-1px); }
    button:focus-visible { outline: 2px solid #0da99b; outline-offset: 2px; }
    button[data-state="loading"] { cursor: progress; background: #3a2c26; color: #f5f1ef; }
    button[data-state="done"], button[data-state="error"] { color: #fff; }
    .spinner { width: 10px; height: 10px; border: 2px solid #ffffff55; border-top-color: #6cc671; border-radius: 50%; animation: s .8s linear infinite; }
    @keyframes s { to { transform: rotate(360deg); } }
  `;

  function setButtonState(button, state, verdict) {
    button.dataset.state = state;
    button.replaceChildren();
    button.style.background = "";
    if (state === "loading") {
      const spin = document.createElement("span");
      spin.className = "spinner";
      button.append(spin, "Analyse…");
      button.title = "Analyse en cours";
    } else if (state === "done") {
      const v = VERDICTS[verdict] ?? VERDICTS["invérifiable"];
      button.textContent = `● ${v.label}`;
      button.style.background = v.color;
      button.title = "Voir le détail dans le panneau Mi-check";
    } else if (state === "error") {
      button.textContent = "⚠ Réessayer";
      button.style.background = "#d64545";
      button.title = "La vérification a échoué — cliquer pour réessayer";
    } else {
      button.textContent = "✓ Vérifier";
      button.title = "Vérifier ce post avec Mi-check";
    }
  }

  function verifyPost(post, postId) {
    // Ouvre le panneau tout de suite : l'appel doit rester dans le geste utilisateur.
    chrome.runtime.sendMessage({ type: "open-panel" });

    const send = () => {
      const text = getPostText(post);
      const imageUrl = getPostImage(post);
      if (!text && !imageUrl) {
        setButtonState(buttons.get(postId).button, "error");
        return;
      }
      chrome.runtime.sendMessage({
        type: "verify-post",
        payload: {
          postId,
          text: text || undefined,
          imageUrl: imageUrl || undefined,
          author: getAuthor(post),
          pageUrl: getPermalink(post),
        },
      });
    };

    setButtonState(buttons.get(postId).button, "loading");
    // Laisse le temps à Facebook d'afficher le texte complet après « En voir plus ».
    if (expandSeeMore(post)) setTimeout(send, 400);
    else send();
  }

  function attachButton(post) {
    const postId = `mc-${++counter}`;
    post.dataset.micheckId = postId;

    if (getComputedStyle(post).position === "static") post.style.position = "relative";

    const host = document.createElement("div");
    host.className = "micheck-host";
    const shadow = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = BUTTON_CSS;
    const button = document.createElement("button");
    button.type = "button";
    setButtonState(button, "idle");
    shadow.append(style, button);

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const entry = buttons.get(postId);
      if (button.dataset.state === "loading") return;
      if (button.dataset.state === "done" && entry.checkId) {
        chrome.runtime.sendMessage({ type: "show-check", checkId: entry.checkId });
        return;
      }
      verifyPost(post, postId);
    });

    post.prepend(host);
    buttons.set(postId, { button, checkId: null });
  }

  // --- Détection des posts ------------------------------------------------------

  function findPosts() {
    const candidates = new Set(document.querySelectorAll(POST_SELECTORS));
    return [...candidates].filter((el) => {
      if (el.dataset.micheckId || el.offsetHeight < 80) return false;
      // Ne garder que le conteneur le plus externe, et ignorer les commentaires.
      if (el.getAttribute("role") === "article" && COMMENT_LABEL.test(el.getAttribute("aria-label") || "")) {
        return false;
      }
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (candidates.has(p) || p.dataset?.micheckId) return false;
      }
      return true;
    });
  }

  function scan() {
    for (const post of findPosts()) {
      // Les posts se chargent progressivement : on attend qu'il y ait du contenu.
      if (getPostText(post).length >= MIN_TEXT || getPostImage(post)) attachButton(post);
    }
  }

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      scan();
    }, 500);
  }

  new MutationObserver(scheduleScan).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("scroll", scheduleScan, { passive: true });
  scan();

  // --- Retour du service worker -------------------------------------------------

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "micheck-status") return;
    const entry = buttons.get(message.postId);
    if (!entry) return;
    entry.checkId = message.checkId;
    setButtonState(entry.button, message.status, message.verdict);
  });
})();
