import { Hero } from "@/components/landing/hero";
import { PhoneMockup } from "@/components/landing/phone_mock";

export function HeroSection() {
  return (
    <section id="verification" className="relative w-full">
      <Hero />
      <PhoneMockup />
    </section>
  );
}
