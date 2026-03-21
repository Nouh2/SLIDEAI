import { useEffect, useState } from "react";
import { BrandKitManager } from "@/components/brand/BrandKitManager";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { hasFeature } from "@/lib/subscription";
import { UpgradeGate } from "@/components/common/UpgradeGate";

export default function BrandKitPage() {
    const navigate = useNavigate();
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setLoading(false);
                return;
            }

            try {
                const data = await api.getMySubscription(session.access_token);
                setSubscription(data);
            } catch (error) {
                console.error("Failed to load subscription", error);
            } finally {
                setLoading(false);
            }
        };

        loadSubscription();
    }, []);

    const canUseBrandKit = hasFeature(subscription, "brand_kit");

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

            {loading ? (
                <Card>
                    <CardContent className="py-10 text-center text-muted-foreground">Loading...</CardContent>
                </Card>
            ) : canUseBrandKit ? (
                <BrandKitManager mode="manage" />
            ) : (
                <UpgradeGate
                    title="Brand Kit reserve a Pro"
                    description="Les brand kits sont disponibles avec Pro et Team. Passez a Pro pour enregistrer vos couleurs, polices et logos."
                    cta="Voir les abonnements"
                    onUpgrade={() => navigate("/pricing")}
                />
            )}
        </div>
    );
}
