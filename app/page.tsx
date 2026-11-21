import { NavBar } from "@/components/layout/navBar";
import { HeroSection } from "@/features/landing/hero";

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#140d0b]">
      <NavBar />
      <HeroSection />
    </main>
  );
}