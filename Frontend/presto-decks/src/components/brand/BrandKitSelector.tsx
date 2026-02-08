import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette, ChevronDown, Check, Plus, Star, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandKit } from '@/lib/api';

interface BrandKitSelectorProps {
    selectedKit: BrandKit | null;
    onSelect: (kit: BrandKit | null) => void;
    className?: string;
}

export function BrandKitSelector({ selectedKit, onSelect, className }: BrandKitSelectorProps) {
    const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchBrandKits();
    }, []);

    const fetchBrandKits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('brand_kits')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });

            if (!error && data) {
                setBrandKits(data);
                // Auto-select default kit if none selected
                const defaultKit = data.find(k => k.is_default);
                if (defaultKit && !selectedKit) {
                    onSelect(defaultKit);
                }
            }
        } catch (e) {
            console.error('Error fetching brand kits:', e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={cn("h-10 rounded-lg bg-muted animate-pulse", className)} />
        );
    }

    // Removed the "return null if empty" check to always show the selector

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="justify-between gap-2 min-w-[200px]"
                    >
                        <div className="flex items-center gap-2">
                            {selectedKit ? (
                                <>
                                    <div className="flex gap-0.5">
                                        {[selectedKit.colors.primary, selectedKit.colors.secondary, selectedKit.colors.accent].map((c, i) => (
                                            <div
                                                key={i}
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <span className="truncate">{selectedKit.name}</span>
                                </>
                            ) : (
                                <>
                                    <Palette className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Charte graphique</span>
                                </>
                            )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-2" align="start">
                    <div className="space-y-1">
                        {/* No kit option */}
                        <button
                            onClick={() => { onSelect(null); setIsOpen(false); }}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                !selectedKit ? "bg-primary/10 text-primary" : "hover:bg-muted"
                            )}
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Aucune charte</span>
                            {!selectedKit && <Check className="w-4 h-4 ml-auto" />}
                        </button>

                        <div className="h-px bg-border my-2" />

                        {/* Brand kits */}
                        {brandKits.length > 0 ? (
                            brandKits.map((kit) => (
                                <button
                                    key={kit.id}
                                    onClick={() => { onSelect(kit); setIsOpen(false); }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                                        selectedKit?.id === kit.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                    )}
                                >
                                    <div className="flex gap-0.5">
                                        {[kit.colors.primary, kit.colors.secondary, kit.colors.accent].map((c, i) => (
                                            <div
                                                key={i}
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-sm flex-1 truncate">{kit.name}</span>
                                    {kit.is_default && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                                    {selectedKit?.id === kit.id && <Check className="w-4 h-4" />}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                <p>Aucun brand kit trouvé.</p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 mt-1 text-primary"
                                    onClick={() => navigate('/brand-kit')}
                                >
                                    Créer maintenant
                                </Button>
                            </div>
                        )}

                        <div className="h-px bg-border my-2" />

                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-muted-foreground hover:text-primary"
                            onClick={() => navigate('/brand-kit')}
                        >
                            <Palette className="w-4 h-4 mr-2" />
                            Gérer les Brand Kits
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>

            {/* Clear button when selected */}
            {selectedKit && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onSelect(null)}
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
