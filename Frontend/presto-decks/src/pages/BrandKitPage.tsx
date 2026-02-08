import { BrandKitManager } from "@/components/brand/BrandKitManager";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Palette, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function BrandKitPage() {
    const navigate = useNavigate();

    return (
        <div className="container py-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <Palette className="w-8 h-8 text-primary" />
                        Brand Kit
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez vos chartes graphiques, logos et couleurs pour des présentations toujours alignées avec votre marque.
                    </p>
                </div>
            </div>

            <BrandKitManager mode="manage" />
        </div>
    );
}
