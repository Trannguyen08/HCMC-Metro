import { HeroSection } from "@/features/metro/components/home/HeroSection";
import { StatsSection } from "@/features/metro/components/home/StatsSection";
import { HomeAmenitiesSection } from "@/features/metro/components/home/HomeAmenitiesSection";
import { FeedbackHighlight } from "@/features/metro/components/home/FeedbackHighlight";
import { FAQSection } from "@/features/metro/components/home/FAQSection";
import { NewsSection } from "@/features/news/components/NewsSection";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-12">
          <HeroSection />
        </div>
      </div>

      <StatsSection />
      
      <NewsSection />
      
      <HomeAmenitiesSection />

      <FeedbackHighlight />

      <FAQSection />
    </div>
  );
}

