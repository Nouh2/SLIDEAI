import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { supabase } from "@/contexts/AuthContext";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type JoinStatus = "loading" | "success" | "error" | "auth_required";

export default function JoinPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<JoinStatus>("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        const joinPresentation = async () => {
            if (!token) {
                setStatus("error");
                setErrorMessage("Lien de partage invalide.");
                return;
            }

            // Check if user is logged in
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Not logged in - redirect to auth with return URL
                setStatus("auth_required");
                return;
            }

            // User is logged in - join the presentation
            try {
                const result = await api.joinPresentation(token, session.access_token);
                setStatus("success");
                // Redirect to editor after a short delay
                setTimeout(() => {
                    navigate(`/editor?id=${result.presentationId}`);
                }, 1500);
            } catch (error: any) {
                setStatus("error");
                setErrorMessage(error.message || "Impossible de rejoindre la présentation.");
            }
        };

        joinPresentation();
    }, [token, navigate]);

    const handleLogin = () => {
        // Redirect to auth page, storing the share URL to return to
        const returnUrl = `/share/${token}`;
        navigate(`/auth?returnTo=${encodeURIComponent(returnUrl)}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-12 rounded-[2rem] bg-surface/50 backdrop-blur-xl border border-border shadow-2xl max-w-md">
                {status === "loading" && (
                    <>
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Chargement...</h2>
                            <p className="text-muted-foreground">Vérification du lien de partage</p>
                        </div>
                    </>
                )}

                {status === "auth_required" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Connexion requise</h2>
                            <p className="text-muted-foreground">
                                Vous devez vous connecter ou créer un compte pour accéder à cette présentation partagée.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={handleLogin} className="w-full">
                                Se connecter
                            </Button>
                            <Button variant="outline" onClick={handleLogin} className="w-full">
                                Créer un compte
                            </Button>
                        </div>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-green-600">Présentation ajoutée !</h2>
                            <p className="text-muted-foreground">
                                Redirection vers l'éditeur...
                            </p>
                        </div>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold">Oops !</h2>
                            <p className="text-muted-foreground">{errorMessage}</p>
                        </div>
                        <Link to="/" className="inline-block">
                            <Button variant="outline">Retour à l'accueil</Button>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
