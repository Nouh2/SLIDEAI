import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const navigate = useNavigate();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useTranslation();

    useEffect(() => {
        // We need to check if we have a session (the link from email should have established one)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, it might be an invalid or expired link
                setVerifying(false);
            } else {
                setVerifying(false);
            }
        });

        // Handle the event where the password recovery state is confirmed
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setVerifying(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast({
                title: t('common.error'),
                description: t('account.passwordMismatch'),
                variant: "destructive",
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: t('common.error'),
                description: t('account.passwordTooShort'),
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            toast({
                title: t('common.success'),
                description: t('auth.resetSuccess'),
            });

            // Redirect after a short delay
            setTimeout(() => {
                navigate("/dashboard");
            }, 2000);
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.message || t('auth.resetError'),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-xl p-8">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                        {t('auth.resetPasswordTitle')}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {t('auth.resetPasswordSubtitle')}
                    </p>
                </div>

                <form onSubmit={handleReset} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t('account.newPassword')}
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="rounded-xl"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t('account.confirmPassword')}
                        </label>
                        <Input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="rounded-xl"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl py-6 font-semibold"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('auth.updating')}
                            </>
                        ) : (
                            t('auth.resetPasswordTitle')
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate("/auth")}
                        className="text-sm text-primary hover:underline font-medium"
                    >
                        {t('auth.backToLogin')}
                    </button>
                </div>
            </div>
        </div>
    );
}
