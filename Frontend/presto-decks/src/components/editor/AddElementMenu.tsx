import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Plus, Type, Image as ImageIcon, Box } from "lucide-react"

export function AddElementMenu({ onAdd }: { onAdd: (type: 'text' | 'image' | 'shape') => void }) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="default"
                    className="h-10 px-5 rounded-xl gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
                >
                    <Plus className="w-4 h-4" />
                    Add
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 bg-background/95 backdrop-blur-sm border-border">
                <DropdownMenuLabel>Insert Content</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAdd('text')} className="gap-2 p-3 cursor-pointer">
                    <Type className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Text Box</span>
                        <span className="text-xs text-muted-foreground">Add a text block</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd('image')} className="gap-2 p-3 cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Image</span>
                        <span className="text-xs text-muted-foreground">Upload from URL</span>
                    </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAdd('shape')} className="gap-2 p-3 cursor-pointer" disabled>
                    <Box className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Shape</span>
                        <span className="text-xs text-muted-foreground">Coming soon</span>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
