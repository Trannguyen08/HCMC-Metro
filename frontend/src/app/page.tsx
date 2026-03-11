import { HeroSection } from "@/components/home/HeroSection";
import { StatsSection } from "@/components/home/StatsSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { NewsSection } from "@/components/home/NewsSection";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <NewsSection />
    </div>
  );
}

