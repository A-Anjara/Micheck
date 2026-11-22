// Mi-check — détection des posts Facebook et bouton « Vérifier ».
// Le DOM de Facebook est obfusqué et change souvent : on s'appuie sur des
// attributs d'accessibilité / data-* plutôt que sur des classes CSS.
(() => {
  if (window.__micheckLoaded) return;
  window.__micheckLoaded = true;
  console.info("[Mi-check] script chargé sur", location.hostname);

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

  // Repère le plus stable : le bouton « … » présent dans l'en-tête de chaque post.
  const POST_MENU_SELECTORS = [
    '[aria-label="Actions pour cette publication"]',
    '[aria-label="Actions for this post"]',
    '[aria-label^="Actions pour cette publication"]',
    '[aria-label^="Actions for this post"]',
  ].join(",");

  const STRONG_POST = 'div[aria-posinset], [data-pagelet^="FeedUnit"]';
  const STOP_AT = 'body, [role="main"], [role="feed"], [role="complementary"], [role="navigation"]';

  const isCommentArticle = (el) =>
    el.getAttribute("role") === "article" && COMMENT_LABEL.test(el.getAttribute("aria-label") || "");

  // Barre d'actions sous chaque post (J'aime / Commenter / Partager).
  const ACTION_SELECTORS = [
    '[data-ad-rendering-role="like_button"]',
    '[data-ad-rendering-role="comment_button"]',
    '[data-ad-rendering-role="share_button"]',
    '[aria-label="J’aime"]',
    "[aria-label=\"J'aime\"]",
    '[aria-label="Like"]',
    '[aria-label="Commenter"]',
    '[aria-label="Comment"]',
    '[aria-label="Laissez un commentaire"]',
    '[aria-label="Leave a comment"]',
    '[aria-label^="Envoyer ceci à vos amis"]',
    '[aria-label^="Send this to friends"]',
  ].join(",");

  const isPostBoundary = (el) =>
    el.matches(STRONG_POST) || (el.getAttribute("role") === "article" && !isCommentArticle(el));

  /**
   * Remonte depuis un repère (menu « … », bloc de texte) jusqu'à la carte du
   * post : le PLUS PETIT ancêtre qui contient aussi la barre d'actions.
   * (Remonter au maximum englobait tout le fil quand un seul post était chargé.)
   */
  function climbToPost(marker, found = new Set()) {
    let el = marker;
    while (el.parentElement && !el.parentElement.matches(STOP_AT)) {
      const prev = el;
      el = el.parentElement;
      if (isPostBoundary(el)) return el;
      // On déborde sur un autre post : on garde le niveau précédent.
      if (el.querySelector("[data-micheck-id]") || [...found].some((c) => el.contains(c))) {
        return prev === marker ? null : prev;
      }
      if (el.querySelector(ACTION_SELECTORS)) return el;
    }
    return null;
  }

  /** Un conteneur marqué qui englobe plusieurs posts est démarqué pour être redécoupé. */
  function isTooBig(post) {
    if (post.querySelector("[data-micheck-id]")) return true;
    const cards = new Set();
    for (const m of post.querySelectorAll(POST_MENU_SELECTORS)) {
      const card = climbToPost(m);
      if (card && card !== post && post.contains(card)) cards.add(card);
    }
    return cards.size >= 2;
  }

  function detachButton(post) {
    const id = post.dataset.micheckId;
    post.querySelector(":scope > .micheck-host")?.remove();
    delete post.dataset.micheckId;
    buttons.delete(id);
  }

  const stats = { menus: 0, messages: 0, legacy: 0 };

  function findPosts() {
    const found = new Set();
    // Déjà traité : le nœud est dans un post équipé, ou en contient un.
    const isDone = (node) =>
      Boolean(node.closest("[data-micheck-id]") || node.querySelector("[data-micheck-id]"));

    const menus = document.querySelectorAll(POST_MENU_SELECTORS);
    const messages = document.querySelectorAll(MESSAGE_SELECTORS);
    const legacy = document.querySelectorAll(POST_SELECTORS);
    Object.assign(stats, { menus: menus.length, messages: messages.length, legacy: legacy.length });

    for (const m of menus) {
      if (!isDone(m)) {
        const post = climbToPost(m, found);
        if (post) found.add(post);
      }
    }
    for (const m of messages) {
      if (!isDone(m) && ![...found].some((p) => p.contains(m))) {
        const post = climbToPost(m, found);
        if (post) found.add(post);
      }
    }
    for (const el of legacy) {
      if (!isDone(el) && !isCommentArticle(el) && ![...found].some((p) => p.contains(el) || el.contains(p))) {
        found.add(el);
      }
    }

    // Ne garder que les conteneurs les plus externes, visibles, pas déjà traités.
    return [...found].filter(
      (el) =>
        !isDone(el) &&
        el.offsetHeight >= 80 &&
        ![...found].some((other) => other !== el && other.contains(el)),
    );
  }

  // --- Indicateur de diagnostic (bas à gauche) -----------------------------------

  // Construit en DOM pur : certains sites (Trusted Types) bloquent le HTML brut.
  const badgeHost = document.createElement("div");
  const badgeShadow = badgeHost.attachShadow({ mode: "closed" });
  const badgeStyle = document.createElement("style");
  badgeStyle.textContent = `
      :host { all: initial; position: fixed; left: 12px; bottom: 12px; z-index: 2147483647; }
      div { font: 600 11px/1 system-ui, sans-serif; color: #f5f1ef; background: #180f0ce6;
            border: 1px solid #6cc671; border-radius: 999px; padding: 6px 10px; cursor: pointer; }
      b { color: #6cc671; }`;
  const badge = document.createElement("div");
  badge.title = "Cliquer pour masquer";
  badgeShadow.append(badgeStyle, badge);
  let badgeHidden = false;
  badge.addEventListener("click", () => {
    badgeHidden = true;
    badgeHost.remove();
  });

  /** Facebook peut retirer les nœuds inconnus : on remet le badge si besoin. */
  function ensureBadge() {
    if (!badgeHidden && !badgeHost.isConnected) document.body.append(badgeHost);
  }

  let lastLog = "";
  function report() {
    ensureBadge();
    badge.replaceChildren();
    const strong = document.createElement("b");
    strong.textContent = "Mi-check";
    badge.append(strong, ` · ${buttons.size} post(s) détecté(s)`);

    const line = `[Mi-check] posts: ${buttons.size} | menus « … »: ${stats.menus} | textes: ${stats.messages} | anciens sélecteurs: ${stats.legacy}`;
    if (line !== lastLog) {
      console.info(line);
      lastLog = line;
    }
  }

  function scan() {
    try {
      for (const post of document.querySelectorAll("[data-micheck-id]")) {
        const entry = buttons.get(post.dataset.micheckId);
        // On ne touche pas à un post en cours d'analyse ou déjà vérifié.
        if (entry?.button.dataset.state === "idle" && isTooBig(post)) detachButton(post);
      }
      for (const post of findPosts()) {
        // Les posts se chargent progressivement : on attend qu'il y ait du contenu.
        if (getPostText(post).length >= MIN_TEXT || getPostImage(post)) attachButton(post);
      }
    } catch (error) {
      console.error("[Mi-check] erreur pendant la détection :", error);
    }
    report();
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
