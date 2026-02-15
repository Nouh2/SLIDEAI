// src/components/brand/BrandKitManager.tsx
// Component for managing brand kits (colors, fonts, logos)
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Plus,
    Palette,
    Trash2,
    Edit,
    Star,
    Check,
    Loader2,
    Type,
    Image as ImageIcon,
    Upload,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandKit, BrandKitInput, TemplateOverlay, api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Available fonts for selection – covers common PowerPoint, Google, and web fonts
const AVAILABLE_FONTS = [
    // Sans-serif
    { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
    { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
    { value: 'Open Sans', label: 'Open Sans', category: 'Sans-serif' },
    { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
    { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
    { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
    { value: 'Nunito', label: 'Nunito', category: 'Sans-serif' },
    { value: 'Nunito Sans', label: 'Nunito Sans', category: 'Sans-serif' },
    { value: 'Raleway', label: 'Raleway', category: 'Sans-serif' },
    { value: 'Work Sans', label: 'Work Sans', category: 'Sans-serif' },
    { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
    { value: 'DM Sans', label: 'DM Sans', category: 'Sans-serif' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro', category: 'Sans-serif' },
    { value: 'Ubuntu', label: 'Ubuntu', category: 'Sans-serif' },
    { value: 'Oswald', label: 'Oswald', category: 'Sans-serif' },
    { value: 'Quicksand', label: 'Quicksand', category: 'Sans-serif' },
    // PowerPoint / Office defaults
    { value: 'Calibri', label: 'Calibri', category: 'Sans-serif' },
    { value: 'Arial', label: 'Arial', category: 'Sans-serif' },
    { value: 'Helvetica', label: 'Helvetica', category: 'Sans-serif' },
    { value: 'Segoe UI', label: 'Segoe UI', category: 'Sans-serif' },
    { value: 'Verdana', label: 'Verdana', category: 'Sans-serif' },
    { value: 'Tahoma', label: 'Tahoma', category: 'Sans-serif' },
    { value: 'Trebuchet MS', label: 'Trebuchet MS', category: 'Sans-serif' },
    { value: 'Century Gothic', label: 'Century Gothic', category: 'Sans-serif' },
    { value: 'Franklin Gothic Medium', label: 'Franklin Gothic Medium', category: 'Sans-serif' },
    { value: 'Gill Sans', label: 'Gill Sans', category: 'Sans-serif' },
    { value: 'Aptos', label: 'Aptos', category: 'Sans-serif' },
    // Serif
    { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
    { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
    { value: 'Lora', label: 'Lora', category: 'Serif' },
    { value: 'Georgia', label: 'Georgia', category: 'Serif' },
    { value: 'Times New Roman', label: 'Times New Roman', category: 'Serif' },
    { value: 'Cambria', label: 'Cambria', category: 'Serif' },
    { value: 'Garamond', label: 'Garamond', category: 'Serif' },
    { value: 'Book Antiqua', label: 'Book Antiqua', category: 'Serif' },
    { value: 'Palatino Linotype', label: 'Palatino Linotype', category: 'Serif' },
    { value: 'PT Serif', label: 'PT Serif', category: 'Serif' },
    { value: 'Noto Serif', label: 'Noto Serif', category: 'Serif' },
    { value: 'EB Garamond', label: 'EB Garamond', category: 'Serif' },
    // Monospace
    { value: 'Source Code Pro', label: 'Source Code Pro', category: 'Monospace' },
    { value: 'Fira Code', label: 'Fira Code', category: 'Monospace' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Monospace' },
    { value: 'Consolas', label: 'Consolas', category: 'Monospace' },
    // Display
    { value: 'Bebas Neue', label: 'Bebas Neue', category: 'Display' },
    { value: 'Anton', label: 'Anton', category: 'Display' },
    { value: 'Impact', label: 'Impact', category: 'Display' },
];

// Preset color palettes for quick selection
const COLOR_PRESETS = [
    { name: 'Corporate Blue', primary: '#1E40AF', secondary: '#3B82F6', accent: '#60A5FA', background: '#FFFFFF', text: '#1F2937' },
    { name: 'Forest Green', primary: '#166534', secondary: '#22C55E', accent: '#86EFAC', background: '#FFFFFF', text: '#1F2937' },
    { name: 'Sunset Orange', primary: '#C2410C', secondary: '#F97316', accent: '#FDBA74', background: '#FFFFFF', text: '#1F2937' },
    { name: 'Modern Purple', primary: '#7C3AED', secondary: '#A78BFA', accent: '#C4B5FD', background: '#FFFFFF', text: '#1F2937' },
    { name: 'Dark Mode', primary: '#8B5CF6', secondary: '#A78BFA', accent: '#C4B5FD', background: '#1F2937', text: '#F9FAFB' },
];

interface BrandKitManagerProps {
    onSelect?: (kit: BrandKit) => void;
    selectedId?: string;
    mode?: 'manage' | 'select'; // 'manage' for full CRUD, 'select' for picker only
}

export function BrandKitManager({ onSelect, selectedId, mode = 'manage' }: BrandKitManagerProps) {
    const { t } = useTranslation();
    const { toast } = useToast();

    const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKit, setEditingKit] = useState<BrandKit | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create optimistic preview
        const objectUrl = URL.createObjectURL(file);

        setIsUploading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast({ title: t("brand.sessionExpired"), variant: "destructive" });
                return;
            }

            // Upload to backend
            const { url } = await api.uploadFile(file, session.access_token);

            setFormData(prev => ({ ...prev, logo_url: url }));
            toast({ title: t("brand.logoUploaded"), description: t("brand.uploadSuccess") });
        } catch (error) {
            console.error("Upload failed", error);
            toast({ title: t("brand.error"), description: t("brand.uploadError"), variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Form state
    const [formData, setFormData] = useState<BrandKitInput>({
        name: '',
        colors: { primary: '#1E40AF', secondary: '#3B82F6', accent: '#60A5FA', background: '#FFFFFF', text: '#1F2937' },
        fonts: { heading: 'Inter', body: 'Inter' },
        template_overlay: {
            logo: { position: 'top-left', size: 'medium', showOnCover: true, showOnContent: true },
            footer: { text: '', showPageNumber: true },
        },
        is_default: false,
    });

    // Dynamically merge extracted fonts into the dropdown options
    const fontOptions = useMemo(() => {
        const knownValues = new Set(AVAILABLE_FONTS.map(f => f.value));
        const extras: typeof AVAILABLE_FONTS = [];
        for (const fontName of [formData.fonts.heading, formData.fonts.body]) {
            if (fontName && !knownValues.has(fontName)) {
                extras.push({ value: fontName, label: `${fontName} ✦`, category: 'Extracted' });
                knownValues.add(fontName);
            }
        }
        return [...extras, ...AVAILABLE_FONTS];
    }, [formData.fonts.heading, formData.fonts.body]);

    // Fetch brand kits on mount
    useEffect(() => {
        fetchBrandKits();
    }, []);

    const fetchBrandKits = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('brand_kits')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching brand kits:', error);
                // Table might not exist yet - that's OK
                setBrandKits([]);
            } else {
                setBrandKits(data || []);
            }
        } catch (e) {
            console.error('Error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({ title: t('brand.error'), description: t('brand.nameRequired'), variant: 'destructive' });
            return;
        }

        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error(t('brand.sessionExpired'));

            if (editingKit) {
                // Update existing
                const { error } = await supabase
                    .from('brand_kits')
                    .update({
                        name: formData.name,
                        colors: formData.colors,
                        fonts: formData.fonts,
                        logo_url: formData.logo_url,
                        template_overlay: formData.template_overlay,
                        is_default: formData.is_default,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', editingKit.id);

                if (error) throw error;
                toast({ title: t('brand.kitUpdated'), description: t('brand.saveSuccessUpdate') });
            } else {
                // Create new
                const { error } = await supabase
                    .from('brand_kits')
                    .insert({
                        user_id: user.id,
                        name: formData.name,
                        colors: formData.colors,
                        fonts: formData.fonts,
                        logo_url: formData.logo_url,
                        template_overlay: formData.template_overlay,
                        is_default: formData.is_default,
                    });

                if (error) throw error;
                toast({ title: t('brand.kitCreated'), description: t('brand.saveSuccessCreate') });
            }

            // If setting as default, unset others
            if (formData.is_default) {
                await supabase
                    .from('brand_kits')
                    .update({ is_default: false })
                    .neq('id', editingKit?.id || '')
                    .eq('user_id', user.id);
            }

            setIsDialogOpen(false);
            setEditingKit(null);
            resetForm();
            fetchBrandKits();
        } catch (e: any) {
            console.error('Save error:', e);
            toast({ title: t('brand.error'), description: e.message || t('brand.saveError'), variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (kit: BrandKit) => {
        if (!confirm(t('brand.deleteConfirm', { name: kit.name }))) return;

        try {
            const { error } = await supabase
                .from('brand_kits')
                .delete()
                .eq('id', kit.id);

            if (error) throw error;
            toast({ title: t('brand.deleted'), description: t('brand.deleteSuccess') });
            fetchBrandKits();
        } catch (e: any) {
            toast({ title: t('brand.error'), description: t('brand.deleteError'), variant: 'destructive' });
        }
    };

    const handleEdit = (kit: BrandKit) => {
        setEditingKit(kit);
        setFormData({
            name: kit.name,
            colors: kit.colors,
            fonts: kit.fonts,
            logo_url: kit.logo_url,
            template_overlay: kit.template_overlay || {
                logo: { position: 'top-left', size: 'medium', showOnCover: true, showOnContent: true },
                footer: { text: '', showPageNumber: true },
            },
            is_default: kit.is_default,
        });
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            colors: { primary: '#1E40AF', secondary: '#3B82F6', accent: '#60A5FA', background: '#FFFFFF', text: '#1F2937' },
            fonts: { heading: 'Inter', body: 'Inter' },
            template_overlay: {
                logo: { position: 'top-left', size: 'medium', showOnCover: true, showOnContent: true },
                footer: { text: '', showPageNumber: true },
            },
            is_default: false,
        });
    };

    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setFormData(prev => ({
            ...prev,
            colors: {
                primary: preset.primary,
                secondary: preset.secondary,
                accent: preset.accent,
                background: preset.background,
                text: preset.text,
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {mode === 'manage' && (
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Palette className="w-5 h-5 text-primary" />
                            {t('brand.myBrandKits')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {t('brand.subtitle')}
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setEditingKit(null); setIsDialogOpen(true); }}>
                        <Plus className="w-4 h-4 mr-2" />
                        {t('brand.newKit')}
                    </Button>
                </div>
            )}

            {/* Brand Kits Grid */}
            {brandKits.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-12 text-center">
                        <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
                        <p className="text-muted-foreground mb-4">{t('brand.noneCreated')}</p>
                        {mode === 'manage' && (
                            <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" />
                                {t('brand.createFirstKit')}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brandKits.map((kit) => (
                        <Card
                            key={kit.id}
                            className={cn(
                                "cursor-pointer transition-all hover:shadow-md",
                                selectedId === kit.id && "ring-2 ring-primary",
                                onSelect && "hover:border-primary"
                            )}
                            onClick={() => onSelect?.(kit)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base">{kit.name}</CardTitle>
                                        {kit.is_default && (
                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        )}
                                    </div>
                                    {mode === 'manage' && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={(e) => { e.stopPropagation(); handleEdit(kit); }}
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={(e) => { e.stopPropagation(); handleDelete(kit); }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Color Preview */}
                                <div className="flex gap-1.5 mb-3">
                                    {Object.entries(kit.colors).slice(0, 4).map(([key, color]) => (
                                        <div
                                            key={key}
                                            className="w-8 h-8 rounded-lg border shadow-sm"
                                            style={{ backgroundColor: color }}
                                            title={key}
                                        />
                                    ))}
                                </div>
                                {/* Fonts */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Type className="w-3 h-3" />
                                    <span>{kit.fonts.heading}</span>
                                    <span>/</span>
                                    <span>{kit.fonts.body}</span>
                                </div>
                                {/* Selection indicator */}
                                {selectedId === kit.id && (
                                    <div className="mt-3 flex items-center gap-1 text-xs text-primary font-medium">
                                        <Check className="w-3 h-3" />
                                        {t('brand.selected')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            {editingKit ? t('brand.editKit') : t('brand.newBrandKit')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('brand.kitDesc')}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Name */}
                        {/* Name */}
                        <div className="space-y-2">
                            <Label>{t('brand.kitName')}</Label>
                            <Input
                                placeholder={t('brand.kitNamePlaceholder')}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Import PPTX */}
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-primary font-semibold">{t('brand.importPptx')}</Label>
                                    <p className="text-xs text-muted-foreground">{t('brand.importPptxDesc')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white hover:bg-primary/5 border-primary/20 text-primary"
                                        onClick={() => document.getElementById('pptx-upload')?.click()}
                                        disabled={isUploading}
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                        {t('brand.importPptxBtn')}
                                    </Button>
                                    <input
                                        id="pptx-upload"
                                        type="file"
                                        accept=".pptx,.key"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;

                                            setIsUploading(true);
                                            try {
                                                const { data: { session } } = await supabase.auth.getSession();
                                                if (!session) return;

                                                const theme = await api.extractTheme(file, session.access_token);

                                                setFormData(prev => ({
                                                    ...prev,
                                                    colors: theme.colors,
                                                    fonts: theme.fonts
                                                }));

                                                toast({ title: t("brand.themeImportSuccess") });
                                            } catch (error: any) {
                                                console.error(error);
                                                toast({ title: t("brand.error"), description: error.message || t("brand.fileReadError"), variant: "destructive" });
                                            } finally {
                                                setIsUploading(false);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Color Presets */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">{t('brand.presets')}</Label>
                            <div className="flex gap-2 flex-wrap">
                                {COLOR_PRESETS.map((preset) => (
                                    <button
                                        key={preset.name}
                                        onClick={() => applyPreset(preset)}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border hover:border-primary transition-colors text-xs"
                                    >
                                        <div className="flex gap-0.5">
                                            {[preset.primary, preset.secondary, preset.accent].map((c, i) => (
                                                <div
                                                    key={i}
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: c }}
                                                />
                                            ))}
                                        </div>
                                        <span>{preset.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="space-y-3">
                            <Label>{t('brand.colors')}</Label>
                            <div className="grid grid-cols-5 gap-3">
                                {Object.entries(formData.colors).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <label className="text-xs text-muted-foreground capitalize">{key}</label>
                                        <div className="relative">
                                            <input
                                                type="color"
                                                value={value}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    colors: { ...formData.colors, [key]: e.target.value }
                                                })}
                                                className="w-full h-10 rounded-lg cursor-pointer border"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fonts */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('brand.headingFont')}</Label>
                                <Select
                                    value={formData.fonts.heading}
                                    onValueChange={(v) => setFormData({
                                        ...formData,
                                        fonts: { ...formData.fonts, heading: v }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fontOptions.map((font) => (
                                            <SelectItem key={font.value} value={font.value}>
                                                <span style={{ fontFamily: font.value }}>{font.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('brand.bodyFont')}</Label>
                                <Select
                                    value={formData.fonts.body}
                                    onValueChange={(v) => setFormData({
                                        ...formData,
                                        fonts: { ...formData.fonts, body: v }
                                    })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {fontOptions.map((font) => (
                                            <SelectItem key={font.value} value={font.value}>
                                                <span style={{ fontFamily: font.value }}>{font.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Template Settings */}
                        <div className="space-y-4 p-4 bg-muted/30 rounded-xl border">
                            <div className="flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary" />
                                <Label className="font-semibold">{t('brand.templateSettings')}</Label>
                            </div>

                            {/* Logo Position */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">{t('brand.logoImage')}</Label>
                                    <div className="flex items-center gap-4">
                                        {formData.logo_url ? (
                                            <div className="relative group">
                                                <img
                                                    src={formData.logo_url}
                                                    alt="Brand Logo"
                                                    className="w-16 h-16 object-contain rounded-lg border bg-white p-1"
                                                />
                                                <button
                                                    onClick={() => setFormData({ ...formData, logo_url: '' })}
                                                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => document.getElementById('logo-upload')?.click()}
                                                    disabled={isUploading}
                                                >
                                                    {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                                                    {t('brand.logoUpload')}
                                                </Button>
                                                <input
                                                    id="logo-upload"
                                                    type="file"
                                                    accept="image/png,image/jpeg,image/svg+xml"
                                                    className="hidden"
                                                    onChange={handleLogoUpload}
                                                />
                                            </div>
                                        )}
                                        <div className="text-xs text-muted-foreground">
                                            {t('brand.logoUploadDesc')}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t('brand.logoPosition')}</Label>
                                        <Select
                                            value={formData.template_overlay?.logo?.position || 'top-left'}
                                            onValueChange={(v: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => setFormData({
                                                ...formData,
                                                template_overlay: {
                                                    ...formData.template_overlay,
                                                    logo: { ...formData.template_overlay?.logo!, position: v }
                                                }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="top-left">{t('brand.positions.topLeft')}</SelectItem>
                                                <SelectItem value="top-right">{t('brand.positions.topRight')}</SelectItem>
                                                <SelectItem value="bottom-left">{t('brand.positions.bottomLeft')}</SelectItem>
                                                <SelectItem value="bottom-right">{t('brand.positions.bottomRight')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">{t('brand.logoSize')}</Label>
                                        <Select
                                            value={formData.template_overlay?.logo?.size || 'medium'}
                                            onValueChange={(v: 'small' | 'medium' | 'large') => setFormData({
                                                ...formData,
                                                template_overlay: {
                                                    ...formData.template_overlay,
                                                    logo: { ...formData.template_overlay?.logo!, size: v }
                                                }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="small">{t('brand.sizes.small')}</SelectItem>
                                                <SelectItem value="medium">{t('brand.sizes.medium')}</SelectItem>
                                                <SelectItem value="large">{t('brand.sizes.large')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Logo Display Options */}
                            <div className="flex gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="logo_cover"
                                        checked={formData.template_overlay?.logo?.showOnCover ?? true}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            template_overlay: {
                                                ...formData.template_overlay,
                                                logo: { ...formData.template_overlay?.logo!, showOnCover: e.target.checked }
                                            }
                                        })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="logo_cover" className="cursor-pointer text-xs">{t('brand.logoShowCover')}</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="logo_content"
                                        checked={formData.template_overlay?.logo?.showOnContent ?? true}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            template_overlay: {
                                                ...formData.template_overlay,
                                                logo: { ...formData.template_overlay?.logo!, showOnContent: e.target.checked }
                                            }
                                        })}
                                        className="rounded"
                                    />
                                    <Label htmlFor="logo_content" className="cursor-pointer text-xs">{t('brand.logoShowContent')}</Label>
                                </div>
                            </div>

                            {/* Footer Settings */}
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">{t('brand.footerText')}</Label>
                                <Input
                                    placeholder={t('brand.footerPlaceholder')}
                                    value={formData.template_overlay?.footer?.text || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        template_overlay: {
                                            ...formData.template_overlay,
                                            footer: { ...formData.template_overlay?.footer!, text: e.target.value }
                                        }
                                    })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="show_page_number"
                                    checked={formData.template_overlay?.footer?.showPageNumber ?? true}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        template_overlay: {
                                            ...formData.template_overlay,
                                            footer: { ...formData.template_overlay?.footer!, showPageNumber: e.target.checked }
                                        }
                                    })}
                                    className="rounded"
                                />
                                <Label htmlFor="show_page_number" className="cursor-pointer text-xs">{t('brand.showPageNumber')}</Label>
                            </div>
                        </div>

                        {/* Set as default */}
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="rounded"
                            />
                            <Label htmlFor="is_default" className="cursor-pointer">
                                {t('brand.setDefault')}
                            </Label>
                        </div>

                        {/* Preview */}
                        <div className="space-y-2">
                            <Label>{t('brand.preview')}</Label>
                            <div
                                className="p-6 rounded-xl border"
                                style={{ backgroundColor: formData.colors.background }}
                            >
                                <h4
                                    className="text-xl font-bold mb-2"
                                    style={{
                                        color: formData.colors.primary,
                                        fontFamily: formData.fonts.heading
                                    }}
                                >
                                    {t('brand.previewTitle')}
                                </h4>
                                <p
                                    className="mb-3"
                                    style={{
                                        color: formData.colors.text,
                                        fontFamily: formData.fonts.body
                                    }}
                                >
                                    {t('brand.previewText')}
                                </p>
                                <div className="flex gap-2">
                                    <span
                                        className="px-3 py-1 rounded-full text-white text-sm"
                                        style={{ backgroundColor: formData.colors.primary }}
                                    >
                                        {t('brand.primary')}
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full text-white text-sm"
                                        style={{ backgroundColor: formData.colors.secondary }}
                                    >
                                        {t('brand.secondary')}
                                    </span>
                                    <span
                                        className="px-3 py-1 rounded-full text-sm"
                                        style={{ backgroundColor: formData.colors.accent, color: formData.colors.text }}
                                    >
                                        {t('brand.accent')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            {t('brand.cancel')}
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('brand.saving')}
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4 mr-2" />
                                    {editingKit ? t('brand.save') : t('brand.createKit')}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
