import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradeGateProps {
  title: string;
  description: string;
  cta: string;
  onUpgrade: () => void;
}

export function UpgradeGate({ title, description, cta, onUpgrade }: UpgradeGateProps) {
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
        <Button onClick={onUpgrade} className="w-full sm:w-auto">
          <Sparkles className="mr-2 h-4 w-4" />
          {cta}
        </Button>
      </CardContent>
    </Card>
  );
}
