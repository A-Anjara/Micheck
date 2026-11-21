// Code partagé entre le service worker et la popup.

export const DEFAULT_API_URL = "http://localhost:3000";
export const MAX_TEXT_LENGTH = 8000;
const MAX_IMAGE_SIDE = 1600;

export const VERDICTS = {
  vrai: { label: "Plutôt vrai", color: "#2e9d4f" },
  faux: { label: "Faux", color: "#d64545" },
  trompeur: { label: "Trompeur", color: "#e08a2c" },
  "invérifiable": { label: "Invérifiable", color: "#7a7a7a" },
};

export async function getApiUrl() {
  const { apiUrl } = await chrome.storage.sync.get("apiUrl");
  return (apiUrl || DEFAULT_API_URL).replace(/\/+$/, "");
}

/** Réduit l'image et la convertit en data URL JPEG/PNG acceptée par l'API. */
export async function blobToDataUrl(blob) {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const out = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
  const bytes = new Uint8Array(await out.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return `data:image/jpeg;base64,${btoa(binary)}`;
}

/** Télécharge une image de la page (l'extension a les permissions d'hôte). */
export async function imageUrlToDataUrl(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Impossible de récupérer l'image (${res.status})`);
  }
  return blobToDataUrl(await res.blob());
}

export async function callVerifyApi({ text, image, pageUrl }) {
  const apiUrl = await getApiUrl();
  let res;
  try {
    res = await fetch(`${apiUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, image, pageUrl }),
    });
  } catch {
    throw new Error(`Serveur Mi-check injoignable (${apiUrl})`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Erreur ${res.status}`);
  }
  return data;
}
