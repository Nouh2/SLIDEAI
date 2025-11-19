import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Plus, X } from "lucide-react";

export default function Brand() {
  const colors = ["#5B8CFF", "#22C55E", "#F59E0B", "#EF4444"];

  return (
    <div className="container py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            Brand Kit
          </h1>
          <p className="text-[var(--muted)] mt-2">
            Définissez votre identité visuelle pour des présentations cohérentes
          </p>
        </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>
                  Uploadez votre logo au format PNG ou SVG
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-3 hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium text-sm">Cliquez pour uploader</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, SVG jusqu'à 5MB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Couleurs</CardTitle>
                <CardDescription>
                  Définissez votre palette de couleurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {colors.map((color, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="aspect-square rounded-lg border-2 border-border cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: color }}
                      />
                      <button className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une couleur
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typographie</CardTitle>
                <CardDescription>
                  Choisissez vos polices de caractères
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titleFont">Police des titres</Label>
                  <Input id="titleFont" defaultValue="Plus Jakarta Sans" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFont">Police du corps de texte</Label>
                  <Input id="bodyFont" defaultValue="Inter" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations</CardTitle>
                <CardDescription>
                  Informations de l'entreprise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nom de l'entreprise</Label>
                  <Input id="companyName" placeholder="Mon Entreprise" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input id="website" placeholder="https://..." />
                </div>
              </CardContent>
            </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="solid" size="lg">
            Enregistrer le Brand Kit
          </Button>
        </div>
      </div>
    </div>
  );
}
