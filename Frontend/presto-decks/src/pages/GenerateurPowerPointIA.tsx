import { BusinessSeoLanding } from "@/components/seo/BusinessSeoLanding";
import { businessSeoPages } from "@/content/seo/marketingPages";

export default function GenerateurPowerPointIA() {
  return <BusinessSeoLanding {...businessSeoPages["generateur-powerpoint-ia"]} />;
}
