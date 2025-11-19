import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent, type: "login" | "signup") => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate auth
    setTimeout(() => {
      setIsLoading(false);
      toast.success(type === "login" ? "Connexion réussie !" : "Compte créé avec succès !");
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <Link to="/" className="flex items-center justify-center space-x-2">
          <span className="font-bold text-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            SlideAI
          </span>
        </Link>

        <Card className="bg-[var(--surface)] border-[var(--border)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              Bienvenue
            </CardTitle>
            <CardDescription className="text-[var(--muted)]">
              Connectez-vous ou créez un compte pour continuer
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={(e) => handleSubmit(e, "login")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="solid"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion..." : "Se connecter"}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    <a href="#" className="text-primary hover:underline">
                      Mot de passe oublié ?
                    </a>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit(e, "signup")} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nom complet</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Jean Dupont"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Mot de passe</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="solid"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Création..." : "Créer mon compte"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    En vous inscrivant, vous acceptez nos{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      CGU
                    </Link>{" "}
                    et notre{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      politique de confidentialité
                    </Link>
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-[var(--muted)]">
          Déjà 10 000+ professionnels font confiance à SlideAI
        </p>
      </div>
    </div>
  );
}
