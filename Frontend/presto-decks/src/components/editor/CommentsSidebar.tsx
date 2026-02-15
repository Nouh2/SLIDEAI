
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Loader2, Send, CheckCircle2, Circle, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Comment {
    id: string;
    presentationId: string;
    slideId: string;
    userId: string;
    content: string;
    resolved: boolean;
    createdAt: string;
    user: {
        email: string;
        id: string;
    };
}

interface CommentsSidebarProps {
    presentationId: string;
    slideId: string;
    accessToken: string;
    onClose: () => void;
    currentUserEmail?: string;
}

export function CommentsSidebar({
    presentationId,
    slideId,
    accessToken,
    onClose,
    currentUserEmail
}: CommentsSidebarProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [presentationId]);

    const loadComments = async () => {
        try {
            setIsLoading(true);
            const data = await api.getComments(presentationId, accessToken);
            setComments(data);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            setIsSubmitting(true);
            const comment = await api.createComment(presentationId, slideId, newComment, accessToken);
            setComments([...comments, comment]);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResolve = async (commentId: string, resolved: boolean) => {
        try {
            await api.resolveComment(commentId, resolved, accessToken);
            setComments(comments.map(c => c.id === commentId ? { ...c, resolved } : c));
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const handleDelete = async (commentId: string) => {
        try {
            await api.deleteComment(commentId, accessToken);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    // Filter comments for current slide
    const slideComments = comments.filter(c => c.slideId === slideId);

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/50">
                <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-bold tracking-tight uppercase text-foreground">
                        Comments
                    </h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    </div>
                ) : slideComments.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <p className="text-sm">Aucun commentaire sur cette slide.</p>
                        <p className="text-xs mt-1">Commencez la discussion !</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {slideComments.map((comment) => (
                            <div
                                key={comment.id}
                                className={cn(
                                    "p-3 rounded-lg border text-sm transition-colors",
                                    comment.resolved
                                        ? "bg-slate-50 border-slate-100 opacity-75"
                                        : "bg-white border-slate-200 shadow-sm"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                            {comment.user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-900 block leading-none">
                                                {comment.user.email.split('@')[0]}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: fr })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-green-50 hover:text-green-600"
                                            onClick={() => handleResolve(comment.id, !comment.resolved)}
                                            title={comment.resolved ? "Rouvrir" : "Résoudre"}
                                        >
                                            {comment.resolved ? (
                                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                            ) : (
                                                <Circle className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-red-50 hover:text-red-600"
                                            onClick={() => handleDelete(comment.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <p className={cn("text-slate-700 whitespace-pre-wrap", comment.resolved && "line-through text-slate-400")}>
                                    {comment.content}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="relative">
                    <Textarea
                        placeholder="Écrire un commentaire..."
                        className="min-h-[80px] pr-10 resize-none bg-white"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2 right-2 h-8 w-8"
                        disabled={!newComment.trim() || isSubmitting}
                        onClick={handleAddComment}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
