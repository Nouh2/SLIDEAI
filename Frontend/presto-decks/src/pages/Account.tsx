import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, CreditCard, FileText, Settings } from "lucide-react";

export default function Account() {
  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            Mon compte
          </h1>
          <p className="text-[var(--muted)] mt-2">
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
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Mettez à jour vos informations de profil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input id="firstName" defaultValue="Jean" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input id="lastName" defaultValue="Dupont" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="jean.dupont@exemple.com" />
                  </div>

                  <Button variant="default">
                    Enregistrer les modifications
                  </Button>
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
                  <div className="space-y-2">
                    <Label htmlFor="language">Langue</Label>
                    <Input id="language" defaultValue="Français" disabled />
                  </div>
                  
                  <div className="pt-4 border-t">
                    <Button variant="destructive">
                      Supprimer mon compte
                    </Button>
                  </div>
                </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
