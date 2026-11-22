// Rendu d'une vérification, partagé par la popup et le panneau latéral.
import { VERDICTS } from "./shared.js";

/** Petit helper DOM : on n'injecte jamais de HTML venant du modèle ou de la page. */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of children) {
    if (child != null) node.append(child);
  }
  return node;
}

function renderPreview(check) {
  const parts = [];
  if (check.author) {
    parts.push(el("div", { className: "preview-author", textContent: `Post de ${check.author}` }));
  }
  if (check.previewImage) {
    parts.push(el("img", { className: "preview-img", src: check.previewImage, alt: "Image vérifiée" }));
  }
  if (check.preview) {
    parts.push(el("div", { className: "preview", textContent: check.preview }));
  }
  return parts;
}

function renderSource(source) {
  let href = null;
  try {
    const url = new URL(source.url);
    if (url.protocol === "https:" || url.protocol === "http:") href = url.href;
  } catch {
    /* URL invalide : affichée sans lien */
  }
  const title = href
    ? el("a", { href, target: "_blank", rel: "noopener noreferrer", textContent: source.title })
    : el("span", { textContent: source.title });

  return el(
    "li",
    {},
    title,
    el("div", { className: "source-domain", textContent: source.domain }),
    source.excerpt ? el("blockquote", { textContent: source.excerpt }) : null,
  );
}

export function renderCheck(container, check) {
  if (!check) {
    container.hidden = true;
    return;
  }

  container.hidden = false;
  container.replaceChildren(...renderPreview(check));

  if (check.status === "loading") {
    container.append(
      el("div", { className: "loading" }, el("div", { className: "spinner" }), "Analyse en cours…"),
    );
    return;
  }

  if (check.status === "error") {
    container.append(el("p", { className: "error", textContent: `Erreur : ${check.error}` }));
    return;
  }

  const r = check.result;
  const v = VERDICTS[r.verdict] ?? VERDICTS["invérifiable"];
  const pill = el("span", { className: "verdict-pill", textContent: v.label });
  pill.style.background = v.color;
  const barFill = el("span");
  barFill.style.width = `${r.confidence}%`;
  barFill.style.background = v.color;

  container.append(
    el(
      "div",
      { className: "verdict" },
      pill,
      el("span", { className: "confidence", textContent: `Confiance : ${r.confidence} %` }),
    ),
    el("div", { className: "bar" }, barFill),
    el("p", { className: "summary", textContent: r.summary }),
    el("p", { textContent: r.explanation }),
  );

  if (r.signals?.length) {
    container.append(
      el("h2", { textContent: "Indices relevés" }),
      el("ul", {}, ...r.signals.map((s) => el("li", { textContent: s }))),
    );
  }
  if (r.advice) {
    container.append(el("h2", { textContent: "Comment vérifier" }), el("p", { textContent: r.advice }));
  }
  if (r.sources?.length) {
    container.append(
      el("h2", { textContent: `Sources consultées (${r.sources.length})` }),
      el("ol", { className: "sources" }, ...r.sources.map(renderSource)),
    );
  } else if (r.webSearch) {
    container.append(el("p", { className: "hint", textContent: "Aucune source trouvée par la recherche web." }));
  }

  container.append(
    el("p", {
      className: "disclaimer",
      textContent: r.webSearch
        ? "Analyse générée par IA à partir d'une recherche web. Ouvrez les sources pour vérifier."
        : "Analyse générée par IA, sans recherche web. Croisez toujours avec des sources fiables.",
    }),
  );
}
