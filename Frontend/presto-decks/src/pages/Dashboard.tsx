import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { Plus, Search, FolderOpen, Copy, Trash2, Calendar, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Presentation {
  id: string;
  user_id: string;
  title: string;
  slides: any;
  theme: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [presentations, setPresentations] = useState<Presentation[]>([]);

  // Load presentations from Supabase (filtered by current user)
  useEffect(() => {
    const fetchPresentations = async () => {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      // Fetch ONLY this user's presentations
      const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .eq('user_id', user.id)  // ⚠️ CRITICAL: Filter by user ID
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching presentations:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos présentations",
          variant: "destructive",
        });
      } else {
        setPresentations(data || []);
      }

      setIsLoading(false);
    };

    fetchPresentations();
  }, [navigate, toast]);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);

      // Delete from Supabase
      const { error } = await supabase
        .from('presentations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setPresentations(prev => prev.filter(p => p.id !== id));

      toast({
        title: "Présentation supprimée",
        description: "La présentation a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la présentation.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Filters + sorting (client-side)
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = presentations.filter((p) => {
      const matchText = p.title.toLowerCase().includes(q);
      const matchTheme = filter === "all" ? true : p.theme?.toLowerCase()?.includes(filter);
      return matchText && matchTheme;
    });

    list = list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [presentations, search, filter, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-gradient">
            Mes Présentations
          </h1>
          <p className="text-muted-foreground text-base">Gérez et organisez vos présentations</p>
        </div>
        <Button size="lg" asChild variant="solid">
          <Link to="/create">
            <Plus className="mr-2 h-5 w-5" />
            Nouvelle Présentation
          </Link>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="bg-surface border-border">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 bg-surface/50 border-border rounded-2xl focus:border-primary transition-all"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-surface/50 border-border rounded-2xl h-12 hover:border-primary transition-all">
                <SelectValue placeholder="Filtrer par thème" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les thèmes</SelectItem>
                <SelectItem value="startup">Startup</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="creative">Creative</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-surface/50 border-border rounded-2xl h-12 hover:border-primary transition-all">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
                <SelectItem value="name">Nom A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((presentation) => (
          <Card
            key={presentation.id}
            className="group bg-surface border-border hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-muted aspect-video">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span className="text-4xl font-bold text-primary/30">
                    {presentation.title.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-surface/80 backdrop-blur-sm border border-border text-xs font-semibold">
                  {presentation.slides?.slides?.length || 0} slides
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {presentation.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    Thème: {presentation.theme}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(presentation.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                    {presentation.status}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-border">
                  <Button size="sm" variant="solid" asChild className="flex-1">
                    <Link to={`/editor?id=${presentation.id}`}>
                      <FolderOpen className="mr-1 h-4 w-4" />
                      Ouvrir
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-destructive/20 hover:border-destructive hover:text-destructive"
                        title="Delete"
                        disabled={deletingId === presentation.id}
                      >
                        {deletingId === presentation.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Cela supprimera définitivement la présentation "{presentation.title}".
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(presentation.id)}
                          className="bg-destructive hover:bg-destructive/90 text-white"
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-primary to-secondary mb-6">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Aucune présentation</h3>
          <p className="text-muted-foreground mb-6">Créez votre première présentation IA</p>
          <Button size="lg" asChild variant="solid">
            <Link to="/create">
              <Plus className="mr-2 h-5 w-5" />
              Créer une présentation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
