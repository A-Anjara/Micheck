export function PhoneMockup() {
    return (
      <div className="relative mx-auto mt-14 h-[260px] w-full max-w-5xl overflow-hidden md:h-[320px]">
        
        <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[#4cb83a] opacity-80 blur-[90px]" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-[#4cb83a] opacity-80 blur-[90px]" />
        <div className="pointer-events-none absolute inset-x-0 -bottom-20 h-40 bg-[#0f9d7a] opacity-60 blur-[80px]" />
  
        {/* Carte gaucheinclinée */}
        <div className="absolute -bottom-16 left-[8%] h-[280px] w-[42%] -rotate-6 rounded-[2rem] bg-[#463c3a]" />
  
        {/* Carte droite inclinée */}
        <div className="absolute -bottom-16 right-[8%] h-[280px] w-[42%] rotate-6 rounded-[2rem] bg-[#463c3a]" />
  
        {/* Téléphone (carte blanche centrale) */}
        <div className="absolute bottom-0 left-1/2 z-10 h-[230px] w-[200px] -translate-x-1/2 rounded-t-[2rem] bg-white md:h-[280px] md:w-[230px]" />
      </div>
    );
  }