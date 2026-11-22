import { Fragment, type ReactNode } from "react";

/** Gère uniquement **gras** — aucun HTML venant du modèle n'est injecté. */
function renderInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+/;

/** Rendu minimal du markdown renvoyé par le modèle : paragraphes, listes, gras. */
export function RichText({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-1 list-disc space-y-1 pl-5">
          {list.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/^#+\s*/, ""); // titres markdown -> texte
    if (LIST_ITEM.test(line)) {
      list.push(line.replace(LIST_ITEM, ""));
      continue;
    }
    flushList();
    if (line.trim()) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-1">
          {renderInline(line)}
        </p>,
      );
    }
  }
  flushList();

  return <>{blocks}</>;
}
