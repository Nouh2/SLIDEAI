import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, FileText, Settings, LogOut, Loader2, Mail, Hash, Zap, Clock, Shield, Sparkles } from "lucide-react";
import { createClient, User as SupabaseUser } from "@supabase/supabase-js";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Account() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [presentations, setPresentations] = useState<any[]>([]);

  useEffect(() => {
    // Check session
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);
      fetchUserData(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        // Only fetch if not already loaded or user changed
        if (session.user.id !== user?.id) {
          fetchUserData(session.user);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchUserData = async (currentUser: SupabaseUser) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [subData, presData] = await Promise.all([
        api.getMySubscription(session.access_token).catch(() => null),
        api.getPresentations(session.access_token).catch(() => ({ owned: [] }))
      ]);

      setSubscription(subData);
      setPresentations(presData.owned || []);
    } catch (error) {
      console.error("Error fetching account data:", error);
    } finally {
      setLoading(false);
    }
  };

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

  // Determine plan characteristics
  const isFree = !subscription || subscription.plan === 'free';
  const isUnlimited = subscription?.creditsRemaining === -1;
  const planColor = isFree ? "text-muted-foreground" : "text-primary";
  const planName = subscription?.plan ? `Plan ${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}` : "Plan Gratuit";

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
              Mon compte
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Gérez vos informations et votre abonnement
            </p>
          </div>
          {isFree && (
            <Button onClick={() => navigate('/pricing')} className="hidden md:flex bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Sparkles className="mr-2 h-4 w-4" /> Passer à Pro
            </Button>
          )}
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 p-1 bg-secondary/30 backdrop-blur-sm rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <User className="mr-2 h-4 w-4" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <CreditCard className="mr-2 h-4 w-4" />
              Abonnement
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all duration-300">
              <Clock className="mr-2 h-4 w-4" />
              Activité
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-8 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Profile Card */}
              <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 group">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                      <p className="font-semibold truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-purple-500/10 rounded-full">
                      <Hash className="h-5 w-5 text-purple-500" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Utilisateur</p>
                      <p className="font-mono text-xs text-muted-foreground truncate" title={user?.id}>{user?.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50 group-hover:bg-secondary/30 transition-colors">
                    <div className="p-3 bg-blue-500/10 rounded-full">
                      <Shield className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fournisseur</p>
                      <p className="font-medium capitalize">{user?.app_metadata?.provider || 'Email'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Card */}
              <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-br from-indigo-500/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-500" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-center">
                      <p className="text-3xl font-bold text-primary">{presentations.length}</p>
                      <p className="text-sm text-muted-foreground mt-1">Présentations</p>
                    </div>
                    <div className="p-4 rounded-xl bg-secondary/20 border border-border/50 text-center">
                      <p className="text-3xl font-bold text-indigo-500">
                        {isUnlimited ? '∞' : (subscription?.creditsRemaining ?? 0)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Crédits restants</p>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <Button
                      variant="destructive"
                      className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-600 hover:text-red-700 border-none shadow-none"
                      onClick={handleSignOut}
                      disabled={signingOut}
                    >
                      {signingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
                      Se déconnecter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="space-y-6 mt-8 animate-fade-in">
            <Card className="max-w-3xl mx-auto border-border/50 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-600" />
              <CardHeader className="text-center pb-8 pt-10">
                <CardTitle className="text-2xl font-bold mb-2">Votre Abonnement</CardTitle>
                <div className="flex items-center justify-center gap-3 mt-4">
                  <Badge variant="outline" className={`px-4 py-1 text-base ${planColor} border-primary/20 bg-primary/5`}>
                    {planName}
                  </Badge>
                  <Badge variant="outline" className="px-4 py-1 text-base text-green-600 border-green-600/20 bg-green-500/5">
                    Actif
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="max-w-lg mx-auto pb-10 space-y-8">

                {/* Credits Progress */}
                {!isUnlimited && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-medium text-muted-foreground">Crédits disponibles</span>
                      <span className="text-xl font-bold text-foreground">{subscription?.creditsRemaining ?? 0}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                      {/* Assuming max credits around 15 for starter for viz purposes, or just show 100% if full. 
                            Ideally need maxCredits in subscription data. For now using arbitrary scale or fallback. */}
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(((subscription?.creditsRemaining || 0) / 15) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Passez à un plan supérieur pour plus de crédits.
                    </p>
                  </div>
                )}

                {isUnlimited && (
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center space-y-2">
                    <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                    <h3 className="font-bold text-lg text-foreground">Accès Illimité</h3>
                    <p className="text-muted-foreground">Vous profitez de la puissance maximale de SlideAI.</p>
                  </div>
                )}

                <div className="pt-6 border-t border-border/50 flex flex-col gap-3">
                  {isFree ? (
                    <Button onClick={() => navigate('/pricing')} className="w-full h-12 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 transition-opacity">
                      Passer à Pro <Sparkles className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button onClick={() => navigate('/pricing')} variant="outline" className="w-full h-12">
                      Gérer mon abonnement
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center max-w-xs mx-auto">
                    La gestion de la facturation se fait via notre partenaire sécurisé Stripe.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 mt-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Présentations récentes</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/app')}>Voir tout</Button>
            </div>

            {presentations.length > 0 ? (
              <div className="grid gap-4">
                {presentations.slice(0, 5).map((pres) => (
                  <div
                    key={pres.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/50 transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/app`)} // Ideally link to edit page if implemented
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{pres.title || "Sans titre"}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(pres.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      Draft
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-dashed border-2 border-border/50 bg-transparent">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-secondary/50 mb-4">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">Aucune présentation</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">
                    Vous n'avez pas encore créé de présentation. Lancez-vous dès maintenant !
                  </p>
                  <Button onClick={() => navigate('/create')}>
                    <Sparkles className="mr-2 h-4 w-4" /> Créer une présentation
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
