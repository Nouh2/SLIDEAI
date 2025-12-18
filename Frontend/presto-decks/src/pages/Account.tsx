import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, FileText, Settings, LogOut, Loader2, Mail, Hash } from "lucide-react";
import { createClient, User as SupabaseUser } from "@supabase/supabase-js";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    // Check session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Not logged in, redirect to auth
        navigate("/auth");
        return;
      }
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gradient">
            Mon compte
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos informations et votre abonnement
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="subscription">
              <CreditCard className="mr-2 h-4 w-4" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger value="history">
              <FileText className="mr-2 h-4 w-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6 mt-6">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  Vos informations de connexion Supabase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || "Non défini"}</p>
                  </div>
                </div>

                {/* Plan */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-3 bg-green-500/10 rounded-full">
                    <CreditCard className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Abonnement</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Plan Gratuit</p>
                      <Badge variant="outline" className="text-green-500 border-green-500/50">Actif</Badge>
                    </div>
                  </div>
                </div>

                {/* User ID */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-3 bg-purple-500/10 rounded-full">
                    <Hash className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">ID Utilisateur</p>
                    <p className="font-mono text-xs text-muted-foreground truncate">{user?.id}</p>
                  </div>
                </div>

                {/* Sign Out Button */}
                <div className="pt-6 border-t">
                  <Button
                    variant="destructive"
                    size="lg"
                    className="w-full"
                    onClick={handleSignOut}
                    disabled={signingOut}
                  >
                    {signingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="mr-2 h-4 w-4" />
                    )}
                    {signingOut ? "Déconnexion..." : "Se Déconnecter"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan actuel</CardTitle>
                <CardDescription>
                  Gérez votre abonnement et votre facturation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">Plan Free</h3>
                      <Badge variant="outline">Actif</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      3 présentations par mois
                    </p>
                  </div>
                  <Button variant="solid">
                    Passer à Pro
                  </Button>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Utilisation ce mois-ci</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Présentations créées</span>
                      <span className="font-medium">1 / 3</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "33%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Présentations récentes</CardTitle>
                <CardDescription>
                  Vos dernières présentations créées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <h4 className="font-medium">Ma Présentation #{i}</h4>
                        <p className="text-sm text-muted-foreground">
                          Créée il y a {i} jour{i > 1 ? "s" : ""}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ouvrir
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>
                  Personnalisez votre expérience SlideAI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">Langue</p>
                    <p className="text-sm text-muted-foreground">Français</p>
                  </div>
                  <Badge>Par défaut</Badge>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" disabled>
                    Supprimer mon compte
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Contactez le support pour supprimer votre compte
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
