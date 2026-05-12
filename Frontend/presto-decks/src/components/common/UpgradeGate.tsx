import { useEffect } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Analytics } from "@/lib/analytics";

interface UpgradeGateProps {
  title: string;
  description: string;
  cta: string;
  onUpgrade: () => void;
  analyticsContext?: {
    surface: string;
    reason?: string;
    feature?: string;
    plan?: string;
  };
}

export function UpgradeGate({ title, description, cta, onUpgrade, analyticsContext }: UpgradeGateProps) {
  const context = analyticsContext || {
    surface: "upgrade_gate",
    reason: "feature_locked",
    feature: title,
  };

  useEffect(() => {
    Analytics.trackPaywallViewed(context);
  }, [context.surface, context.reason, context.feature, context.plan]);

  const handleUpgrade = () => {
    Analytics.trackPaywallCtaClicked(context);
    onUpgrade();
  };

  return (
    <Card className="border-dashed border-border/60 bg-secondary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lock className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleUpgrade} className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
