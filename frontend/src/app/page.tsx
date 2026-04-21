import { FeaturedGrid } from "@/components/sections/featured-grid";
import { HeroSlider } from "@/components/sections/hero";
import { CTASection } from "@/components/sections/newsletter";
import { SocialProofSection } from "@/components/sections/social-proof";
import { TrustSection } from "@/components/sections/trust-section";

export default function HomePage() {
  return (
    <>
      <HeroSlider />
      <FeaturedGrid />
      <TrustSection />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
