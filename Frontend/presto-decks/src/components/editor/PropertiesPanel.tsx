import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Type, List, Image as ImageIcon } from "lucide-react";

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
    onClose: () => void;
}

export function PropertiesPanel({ element, onUpdate, onClose }: PropertiesPanelProps) {
    const [localValue, setLocalValue] = useState<string>("");

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
        <div className="w-80 h-full border-l border-border bg-surface/50 backdrop-blur-xl p-6 flex flex-col shadow-xl z-40 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    {element.type === 'text' && <Type className="w-4 h-4 text-primary" />}
                    {element.type === 'list' && <List className="w-4 h-4 text-primary" />}
                    {element.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                    Edit {element.label || "Element"}
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto">
                {element.type === 'text' || element.type === 'list' ? (
                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Content</Label>
                        <Textarea
                            value={localValue}
                            onChange={handleChange}
                            className="min-h-[200px] bg-background/50 resize-none focus-visible:ring-primary"
                            placeholder="Enter text..."
                        />
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                        Editing for this element type is coming soon.
                    </div>
                )}
            </div>

            <div className="mt-auto pt-6 border-t border-border">
                <p className="text-xs text-center text-muted-foreground">
                    Changes are applied automatically.
                </p>
            </div>
        </div>
    );
}
