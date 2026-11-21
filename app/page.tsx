import { AnalyzeSection } from "@/components/landing/analyze";
import { StepsSection } from "@/components/landing/steps";
import { HeroSection } from "@/features/landing/hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#180F0C]">
      <HeroSection />
      <AnalyzeSection />
      <StepsSection />
    </main>
  );
}
