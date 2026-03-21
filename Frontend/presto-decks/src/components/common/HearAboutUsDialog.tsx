import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const STORAGE_KEY = (userId: string) => `slideai-heard-about-us-${userId}`;

const DISCORD_WEBHOOK_URL =
    "https://discordapp.com/api/webhooks/1462897571730292829/jidCSbUuPQOo42O6lagM5kLGPFChGmoOgoRrbO0LSu2uXxIOW0rsSQEFFoA5Ph2Da4NN";

const SOURCES = [
    { id: "google", label: "Google / Moteur de recherche", emoji: "🔍" },
    { id: "linkedin", label: "LinkedIn", emoji: "💼" },
    { id: "twitter", label: "Twitter / X", emoji: "𝕏" },
    { id: "tiktok", label: "TikTok", emoji: "🎵" },
    { id: "instagram", label: "Instagram", emoji: "📸" },
    { id: "youtube", label: "YouTube", emoji: "▶️" },
    { id: "reddit", label: "Reddit", emoji: "🤖" },
    { id: "producthunt", label: "Product Hunt", emoji: "🚀" },
    { id: "bouche_a_oreille", label: "Bouche à oreille", emoji: "👥" },
    { id: "shared_link", label: "Lien partagé par quelqu'un", emoji: "🔗" },
    { id: "newsletter", label: "Newsletter / Email", emoji: "📧" },
    { id: "other", label: "Autre", emoji: "✏️" },
];

interface HearAboutUsDialogProps {
    userId: string;
    userEmail?: string;
    accessToken: string;
    hearAboutAnswered?: boolean;
}

export function HearAboutUsDialog({ userId, userEmail, accessToken, hearAboutAnswered }: HearAboutUsDialogProps) {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [otherText, setOtherText] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (!userId) return;
        // If DB says already answered, cache locally and don't show
        if (hearAboutAnswered) {
            localStorage.setItem(STORAGE_KEY(userId), "answered");
            return;
        }
        const already = localStorage.getItem(STORAGE_KEY(userId));
        if (!already) setOpen(true);
    }, [userId, hearAboutAnswered]);

    const canSubmit = selected !== null && (selected !== "other" || otherText.trim().length > 0);

    const handleSubmit = async () => {
        if (!canSubmit || sending) return;
        setSending(true);

        const source = SOURCES.find((s) => s.id === selected);
        const label = selected === "other" ? `Autre: ${otherText.trim()}` : source?.label ?? selected;

        try {
            await fetch(DISCORD_WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    embeds: [
                        {
                            title: "📊 Nouveau — Comment il nous a connu",
                            color: 0x6366f1,
                            fields: [
                                { name: "Source", value: label, inline: true },
                                { name: "Email", value: userEmail ?? userId, inline: true },
                            ],
                            timestamp: new Date().toISOString(),
                        },
                    ],
                }),
            });
        } catch {
            // Silent — don't block UX on network failure
        }

        // Persist to DB (fire-and-forget, don't block UX)
        api.saveHearAboutUs(label, accessToken).catch(() => {});

        localStorage.setItem(STORAGE_KEY(userId), label);
        setSending(false);
        setOpen(false);
    };

    return (
        <Dialog
            open={open}
            onOpenChange={() => {
                // Intentionally empty — no escape possible
            }}
        >
            <DialogContent
                className="sm:max-w-md gap-5"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                // Hide the default X close button
                hideCloseButton
            >
                <DialogHeader>
                    <DialogTitle className="text-xl">Comment vous avez entendu parler de nous ? 👋</DialogTitle>
                    <DialogDescription>
                        Une seule question pour mieux vous servir.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-2">
                    {SOURCES.map((source) => (
                        <button
                            key={source.id}
                            onClick={() => {
                                setSelected(source.id);
                                if (source.id !== "other") setOtherText("");
                            }}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all",
                                selected === source.id
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-primary/40 hover:bg-muted/50"
                            )}
                        >
                            <span className="text-base">{source.emoji}</span>
                            {source.label}
                        </button>
                    ))}
                </div>

                {selected === "other" && (
                    <Input
                        autoFocus
                        placeholder="Précisez…"
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && canSubmit && handleSubmit()}
                        className="mt-1"
                    />
                )}

                <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || sending}
                    className="w-full"
                >
                    {sending ? "Envoi…" : "Envoyer"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
