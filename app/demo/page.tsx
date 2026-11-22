import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo Mi-check — faux fil d'actualité",
  description: "Page de test de l'extension Mi-check (posts fictifs).",
};

interface DemoPost {
  author: string;
  time: string;
  text?: string;
  image?: string;
  comment?: { author: string; text: string };
}

// Pages et contenus fictifs, uniquement pour tester l'extension.
const POSTS: DemoPost[] = [
  {
    author: "Info Choc 24",
    time: "2 h",
    text: "🚨 URGENT : le gouvernement va interdire TOUTES les voitures diesel dès lundi prochain ! Les contrôles commencent dès 6 h du matin. Partagez avant que ce post soit supprimé !!!",
    comment: {
      author: "Paul R.",
      text: "Ce commentaire ne doit pas être analysé par Mi-check.",
    },
  },
  {
    author: "Santé au Naturel",
    time: "5 h",
    text: "Boire un verre d'eau chaude citronnée chaque matin guérit le cancer en 3 semaines. Les laboratoires pharmaceutiques ne veulent pas que vous le sachiez 🍋",
  },
  {
    author: "Le Saviez-Vous ?",
    time: "Hier à 18:42",
    text: "La Grande Muraille de Chine est le seul ouvrage humain visible à l'œil nu depuis l'espace.",
  },
  {
    author: "Club d'astronomie amateur",
    time: "Hier à 09:15",
    text: "Rappel : le solstice d'hiver a lieu vers le 21 décembre. C'est le jour le plus court de l'année dans l'hémisphère Nord.",
  },
  {
    author: "Actu Express",
    time: "3 j",
    text: "Photo prise ce matin : les réseaux sociaux seront payants pour tout le monde à partir du 1er janvier.",
    image: "/card-hero-1.png",
  },
];

function Post({ post, index }: { post: DemoPost; index: number }) {
  return (
    <div
      aria-posinset={index + 1}
      className="rounded-lg bg-white text-[#050505] shadow-sm"
    >
      <div className="flex items-center gap-2 px-4 pt-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0da99b] to-[#6cc671]" />
        <div className="flex-1">
          <h4 className="text-[15px] leading-tight">
            <strong>
              <a href="#">{post.author}</a>
            </strong>
          </h4>
          <a
            href={`#post-${index + 1}`}
            className="text-[13px] text-[#65676b]"
          >
            {post.time} · 🌍
          </a>
        </div>
        <div
          role="button"
          aria-label="Actions pour cette publication"
          className="rounded-full px-2 text-xl text-[#65676b]"
        >
          …
        </div>
      </div>

      {post.text && (
        <div data-ad-preview="message" className="px-4 py-3 text-[15px]">
          <div dir="auto">{post.text}</div>
        </div>
      )}

      {post.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image}
          alt=""
          width={680}
          height={793}
          className="w-full"
        />
      )}

      <div className="mx-4 flex justify-around border-t border-[#ced0d4] py-1 text-[15px] font-semibold text-[#65676b]">
        <div role="button" aria-label="J’aime">👍 J’aime</div>
        <div role="button">💬 Commenter</div>
        <div role="button">↗ Partager</div>
      </div>

      {post.comment && (
        <ul className="px-4 pb-3">
          <li>
            <div
              role="article"
              aria-label={`Commentaire de ${post.comment.author}`}
              className="inline-block rounded-2xl bg-[#f0f2f5] px-3 py-2 text-[13px]"
            >
              <strong>{post.comment.author}</strong>
              <div dir="auto">{post.comment.text}</div>
            </div>
          </li>
        </ul>
      )}
    </div>
  );
}

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#f0f2f5] py-6">
      <div className="mx-auto max-w-[680px] px-2">
        <p className="mb-4 rounded-lg bg-[#180F0C] px-4 py-3 text-sm text-white">
          <strong className="text-[#6cc671]">Démo Mi-check</strong> — faux fil
          d&apos;actualité avec des posts fictifs. Avec l&apos;extension
          installée, chaque post affiche un bouton « ✓ Vérifier ».
        </p>
        <div role="feed" className="flex flex-col gap-4">
          {POSTS.map((post, index) => (
            <Post key={index} post={post} index={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
