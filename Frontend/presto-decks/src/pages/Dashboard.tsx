import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideThumbnail } from "@/components/slides/SlideThumbnail";
import { examples } from "@/data/examples";
import { Plus, Search, FolderOpen, Copy, Trash2, Calendar, Eye } from "lucide-react";

type Project = {
  id: string;
  title: string;
  prompt: string;
  slides: any[];
  theme: any;
  createdAt: string;
  usage: number;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Mock projects using examples data
  const projects: Project[] = [
    { id: "deck-1", ...examples[0], createdAt: "2025-01-08", usage: 245 },
    { id: "deck-2", ...examples[1], createdAt: "2025-01-07", usage: 189 },
    { id: "deck-3", ...examples[2], createdAt: "2025-01-05", usage: 312 },
  ];

  // Filtres + tri (client) pour coller aux contrôles UI
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = projects.filter((p) => {
      const matchText =
        p.title.toLowerCase().includes(q) ||
        (p.prompt?.toLowerCase?.().includes(q) ?? false);

      const matchTheme =
        filter === "all"
          ? true
          : (p.theme?.id ?? p.theme)?.toString?.().toLowerCase?.().includes(filter);

      return matchText && matchTheme;
    });

    list = list.sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === "usage") return (b.usage || 0) - (a.usage || 0);
      if (sortBy === "name") return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [projects, search, filter, sortBy]);

  return (
    <div className="container py-12 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
            My Projects
          </h1>
          <p className="text-[var(--muted)] text-base">Manage and organize your presentations</p>
        </div>
        <Button size="lg" asChild variant="solid">
          <Link to="/">
            <Plus className="mr-2 h-5 w-5" />
            New Presentation
          </Link>
        </Button>
      </div>

      {/* Filters & Search */}
      <Card className="bg-[var(--surface)] border-[var(--border)]">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search presentations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 bg-[var(--surface)]/50 border-[var(--border)] rounded-2xl focus:border-[var(--primary)] transition-all"
              />
            </div>

            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="bg-[var(--surface)]/50 border-[var(--border)] rounded-2xl h-12 hover:border-[var(--primary)] transition-all">
                <SelectValue placeholder="Filter by theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Themes</SelectItem>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="bold">Bold</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-[var(--surface)]/50 border-[var(--border)] rounded-2xl h-12 hover:border-[var(--primary)] transition-all">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="usage">Most Used</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((project) => (
          <Card
            key={project.id}
            className="group bg-[var(--surface)] border-[var(--border)] hover:scale-[1.02] hover:border-[var(--primary)]/50 transition-all duration-300 overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Thumbnail */}
              <div className="relative overflow-hidden bg-[var(--bg)]">
                <SlideThumbnail example={project} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[var(--surface)]/80 backdrop-blur-sm border border-[var(--border)] text-xs font-semibold">
                  {project.slides.length} slides
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-[var(--primary)] transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-2">
                    {project.prompt?.slice?.(0, 100)}...
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{project.createdAt}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Eye className="h-3.5 w-3.5" />
                    <span>{project.usage}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                  {/* ✅ Ouvre l'éditeur via la route compatible */}
                  <Button size="sm" variant="solid" asChild className="flex-1">
                    <Link to={`/editor/${encodeURIComponent(project.id)}`}>
                      <FolderOpen className="mr-1 h-4 w-4" />
                      Open
                    </Link>
                  </Button>

                  <Button size="sm" variant="outline" title="Duplicate">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hover:bg-[var(--danger)]/20 hover:border-[var(--danger)]"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] mb-6">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No presentations yet</h3>
          <p className="text-[var(--muted)] mb-6">Create your first AI-powered presentation</p>
          <Button size="lg" asChild variant="solid">
            <Link to="/">
              <Plus className="mr-2 h-5 w-5" />
              Create Presentation
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
