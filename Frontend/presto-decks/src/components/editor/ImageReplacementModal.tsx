// src/components/editor/ImageReplacementModal.tsx
// Modal for replacing slide images via Unsplash search or user upload
import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Upload, Image, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageReplacementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImageSelect: (imageUrl: string, attribution?: { name: string; username: string; link: string }) => void;
    currentImage?: string;
}

interface UnsplashPhoto {
    id: string;
    urls: {
        small: string;
        regular: string;
        full: string;
    };
    alt_description: string;
    user: {
        name: string;
        username: string;
        links: {
            html: string;
        };
    };
}

// Unsplash API configuration
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '';
const UTM_PARAMS = '?utm_source=SlideAI&utm_medium=referral';

export function ImageReplacementModal({
    open,
    onOpenChange,
    onImageSelect,
    currentImage
}: ImageReplacementModalProps) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'unsplash' | 'upload'>('unsplash');

    // Unsplash state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UnsplashPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<UnsplashPhoto | null>(null);

    // Upload state
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Search Unsplash
    const handleSearch = async () => {
        if (!searchQuery.trim() || !UNSPLASH_ACCESS_KEY) return;

        setIsSearching(true);
        setSelectedPhoto(null);

        try {
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=12&orientation=landscape`,
                {
                    headers: {
                        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                    }
                }
            );

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.results || []);
            }
        } catch (error) {
            console.error('Unsplash search error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    // Handle file upload
    const handleFileUpload = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) return;

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            console.error('File too large');
            return;
        }

        setIsUploading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            setUploadedImage(e.target?.result as string);
            setIsUploading(false);
        };
        reader.onerror = () => {
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    // Confirm selection
    const handleConfirm = () => {
        if (activeTab === 'unsplash' && selectedPhoto) {
            onImageSelect(selectedPhoto.urls.regular, {
                name: selectedPhoto.user.name,
                username: selectedPhoto.user.username,
                link: `${selectedPhoto.user.links.html}${UTM_PARAMS}`
            });
        } else if (activeTab === 'upload' && uploadedImage) {
            onImageSelect(uploadedImage);
        }

        // Reset state
        setSearchQuery('');
        setSearchResults([]);
        setSelectedPhoto(null);
        setUploadedImage(null);
        onOpenChange(false);
    };

    const hasSelection = (activeTab === 'unsplash' && selectedPhoto) || (activeTab === 'upload' && uploadedImage);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image className="w-5 h-5" />
                        Remplacer l'image
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="unsplash" className="flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Banque Unsplash
                        </TabsTrigger>
                        <TabsTrigger value="upload" className="flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Votre Image
                        </TabsTrigger>
                    </TabsList>

                    {/* Unsplash Tab */}
                    <TabsContent value="unsplash" className="flex-1 flex flex-col overflow-hidden mt-4">
                        {/* Search Bar */}
                        <div className="flex gap-2 mb-4">
                            <Input
                                placeholder="Rechercher des images (ex: business, nature, technology...)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="flex-1"
                            />
                            <Button onClick={handleSearch} disabled={isSearching || !UNSPLASH_ACCESS_KEY}>
                                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>

                        {/* Results Grid */}
                        <div className="flex-1 overflow-y-auto">
                            {!UNSPLASH_ACCESS_KEY ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p className="mb-2">Clé API Unsplash non configurée</p>
                                    <p className="text-sm">Ajoutez VITE_UNSPLASH_ACCESS_KEY à votre .env</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Image className="w-12 h-12 mx-auto mb-4 opacity-40" />
                                    <p>Recherchez des images gratuites sur Unsplash</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {searchResults.map((photo) => (
                                        <button
                                            key={photo.id}
                                            onClick={() => setSelectedPhoto(photo)}
                                            className={cn(
                                                "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02]",
                                                selectedPhoto?.id === photo.id
                                                    ? "border-primary ring-2 ring-primary/30"
                                                    : "border-transparent hover:border-muted-foreground/30"
                                            )}
                                        >
                                            <img
                                                src={photo.urls.small}
                                                alt={photo.alt_description || 'Unsplash photo'}
                                                className="w-full h-full object-cover"
                                            />
                                            {selectedPhoto?.id === photo.id && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <CheckCircle className="w-8 h-8 text-white drop-shadow-lg" />
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                                                <p className="text-white text-xs truncate flex items-center gap-1">
                                                    {photo.user.name}
                                                    <ExternalLink className="w-3 h-3 inline opacity-60" />
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Attribution notice */}
                        {searchResults.length > 0 && (
                            <p className="text-xs text-muted-foreground text-center mt-3">
                                Photos par <a href={`https://unsplash.com${UTM_PARAMS}`} target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>. L'attribution sera automatiquement ajoutée.
                            </p>
                        )}
                    </TabsContent>

                    {/* Upload Tab */}
                    <TabsContent value="upload" className="flex-1 flex flex-col mt-4">
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                            onDrop={handleDrop}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-colors cursor-pointer min-h-[300px]",
                                isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50",
                                uploadedImage && "border-solid"
                            )}
                            onClick={() => !uploadedImage && fileInputRef.current?.click()}
                        >
                            {isUploading ? (
                                <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
                            ) : uploadedImage ? (
                                <div className="relative w-full h-full p-4">
                                    <img
                                        src={uploadedImage}
                                        alt="Uploaded preview"
                                        className="w-full h-full object-contain rounded-lg"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="absolute top-6 right-6"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setUploadedImage(null);
                                        }}
                                    >
                                        Changer
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center p-8">
                                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="font-medium mb-2">Glissez une image ici</p>
                                    <p className="text-sm text-muted-foreground mb-4">ou cliquez pour parcourir</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, WebP • Max 5 Mo</p>
                                </div>
                            )}
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Annuler
                    </Button>
                    <Button onClick={handleConfirm} disabled={!hasSelection}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Appliquer
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
