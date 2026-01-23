import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Type, List, Image as ImageIcon, Plus, Table, Trash2 } from "lucide-react";

export interface SelectedElement {
    id: string; // Unique ID composed of slideIndex + path
    type: 'text' | 'image' | 'list' | 'chart';
    path: string; // Path to property in slide object (e.g. "title", "bullets[0]")
    value: any;
    label?: string;
}

interface PropertiesPanelProps {
    element: SelectedElement | null;
    onUpdate: (path: string, value: any) => void;
    onTableAction?: (action: 'add-row' | 'delete-row', path: string) => void;
    onClose: () => void;
}

export function PropertiesPanel({ element, onUpdate, onTableAction, onClose }: PropertiesPanelProps) {
    const [localValue, setLocalValue] = useState<string>("");
    const { t } = useTranslation();

    useEffect(() => {
        if (element) {
            setLocalValue(element.value || "");
        }
    }, [element]);

    if (!element) return null;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalValue(e.target.value);
        onUpdate(element.path, e.target.value);
    };

    return (
        <div className="w-full h-full border-l border-border bg-surface/50 backdrop-blur-xl p-6 flex flex-col shadow-xl z-40 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {element.type === 'text' && <Type className="w-4 h-4 text-primary" />}
                    {element.type === 'list' && <List className="w-4 h-4 text-primary" />}
                    {element.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                    {t('editor.editElement')} {element.label || t('editor.element')}
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
                {element.type === 'text' || element.type === 'list' ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('editor.content')}</Label>
                            <Textarea
                                value={localValue}
                                onChange={handleChange}
                                className="min-h-[200px] bg-background/50 resize-none focus-visible:ring-primary"
                                placeholder={t('editor.enterText')}
                            />
                        </div>

                        {onTableAction && element.path.includes('rows') && element.path.includes('[') && (
                            <div className="p-4 border border-border/50 rounded-xl bg-muted/20 space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Table className="w-3 h-3" /> {t('editor.tableStructure')}
                                </Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 h-9 border-dashed hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                                    onClick={() => onTableAction('add-row', element.path)}
                                >
                                    <Plus className="w-4 h-4" />
                                    {t('editor.addRow')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 h-9 border-dashed border-red-200 text-red-600 hover:border-red-500 hover:bg-red-50 transition-colors"
                                    onClick={() => onTableAction('delete-row', element.path)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    {t('editor.deleteRow')}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                        {t('editor.editingComingSoon')}
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                    {t('editor.changesApplied')}
                </p>
            </div>
        </div>
    );
}

