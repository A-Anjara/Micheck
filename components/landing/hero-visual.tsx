import Image from "next/image";

const cards = [
  {
    src: "/card-hero-2.png",
    width: 972,
    alt: "Blogs et articles à consulter",
    className:
      "left-[15%] top-[23%] z-10 w-[65%] -rotate-[12deg] sm:left-[10%] sm:top-[20%] sm:w-[43%] lg:w-[37%]",
  },
  {
    src: "/card-hero-1.png",
    width: 904,
    alt: "Réseaux sociaux sur un téléphone",
    className:
      "left-1/2 top-[8%] z-30 w-[69%] -translate-x-1/2 sm:top-[5%] sm:w-[43%] lg:w-[36%]",
  },
  {
    src: "/card-hero-3.png",
    width: 972,
    alt: "Conversations dans une application de messagerie",
    className:
      "right-[15%] top-[23%] z-20 w-[65%] rotate-[12deg] sm:right-[10%] sm:top-[20%] sm:w-[43%] lg:w-[37%]",
  },
] as const;

export function HeroVisual() {
  return (
    <div className="site-container relative mt-10 h-[min(88vw,560px)] overflow-hidden sm:mt-16 sm:h-[min(50vw,650px)] lg:mt-20 lg:h-[min(45vw,650px)]">
      {cards.map((card) => (
        <div key={card.src} className={`absolute ${card.className}`}>
          <Image
            src={card.src}
            alt={card.alt}
            width={card.width}
            height={1054}
            sizes="(max-width: 639px) 69vw, (max-width: 1023px) 43vw, 36vw"
            className="h-auto w-full"
            priority
          />
        </div>
      ))}
    </div>
  );
}
