import { AnalyzeSection } from "@/components/landing/analyze";
import { ExtensionSection } from "@/components/landing/extension";
import { StepsSection } from "@/components/landing/steps";
import { VerifyTool } from "@/components/landing/verify-tool";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Footer } from "@/components/layout/footer";
import { HeroSection } from "@/features/landing/hero";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-[#180F0C]">
        <HeroSection />
        <AnalyzeSection />
        <VerifyTool />
        <StepsSection />
        <ExtensionSection />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
