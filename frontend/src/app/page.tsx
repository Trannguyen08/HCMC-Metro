import { HeroSection } from "@/features/metro/components/home/HeroSection";
import { StatsSection } from "@/features/metro/components/home/StatsSection";
import { FeaturesSection } from "@/features/metro/components/home/FeaturesSection";
import { HomeAmenitiesSection } from "@/features/metro/components/home/HomeAmenitiesSection";
import { NewsSection } from "@/features/news/components/NewsSection";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <NewsSection />
      <HomeAmenitiesSection />
    </div>
  );
}
