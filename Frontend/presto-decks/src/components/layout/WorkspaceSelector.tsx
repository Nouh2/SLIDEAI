import { useState, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Building2, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CreateOrgDialog } from "./CreateOrgDialog";
import { useNavigate } from "react-router-dom";
import { hasFeature } from "@/lib/subscription";

interface Org {
    id: string;
    name: string;
    role: string;
    createdAt: string;
}

export function WorkspaceSelector() {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    // Load orgs and current selection
    useEffect(() => {
        const loadOrgs = async () => {
            if (!session?.access_token) return;
            try {
                const [data, subscriptionData] = await Promise.all([
                    api.getUserOrgs(session.access_token),
                    api.getMySubscription(session.access_token).catch(() => null),
                ]);
                setSubscription(subscriptionData);
                const canUseTeamWorkspace = hasFeature(subscriptionData, "team_workspace");

                if (!canUseTeamWorkspace) {
                    setOrgs([]);
                    localStorage.setItem('slideai-org-id', 'personal');
                    setCurrentOrgId('personal');
                    return;
                }

                setOrgs(data);

                // Load current selection from local storage
                const savedOrgId = localStorage.getItem('slideai-org-id');
                if (savedOrgId && savedOrgId !== 'personal') {
                    // Verify membership still exists
                    const exists = data.find((o: Org) => o.id === savedOrgId);
                    if (exists) {
                        setCurrentOrgId(savedOrgId);
                    } else {
                        // Fallback to personal if removed from org
                        localStorage.setItem('slideai-org-id', 'personal');
                        setCurrentOrgId('personal');
                    }
                } else {
                    setCurrentOrgId('personal');
                }
            } catch (error) {
                console.error("Failed to load organizations", error);
                setOrgs([]);
                setSubscription(null);
                localStorage.setItem('slideai-org-id', 'personal');
                setCurrentOrgId('personal');
            }
        };

        loadOrgs();
    }, [session?.access_token]);

    const handleSelectOrg = (orgId: string) => {
        if (orgId === currentOrgId) return;

        localStorage.setItem('slideai-org-id', orgId);
        setCurrentOrgId(orgId);
        setOpen(false);

        // Reload to apply new context globally (simplest way to ensure api headers and queries update)
        window.location.reload();
    };

    const handleCreateSuccess = (newOrg: Org) => {
        setOrgs([...orgs, newOrg]);
        // Auto-switch to new org
        handleSelectOrg(newOrg.id);
    };

    const currentOrg = orgs.find(o => o.id === currentOrgId);
    const canManageWorkspace = hasFeature(subscription, "team_workspace");

    if (!session) return null;

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        role="combobox"
                        aria-expanded={open}
                        className="h-9 px-2 gap-1.5 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100/80"
                    >
                        {currentOrgId === 'personal' || !currentOrg ? (
                            <span className="flex items-center gap-1.5">
                                <User className="h-4 w-4" />
                                <span className="text-sm font-medium">Personal</span>
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <Building2 className="h-4 w-4" />
                                <span className="text-sm font-medium">{currentOrg.name}</span>
                            </span>
                        )}
                        <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuItem
                        onSelect={() => handleSelectOrg('personal')}
                        className="cursor-pointer"
                    >
                        <User className="mr-2 h-4 w-4" />
                        Personal
                        {currentOrgId === 'personal' && (
                            <Check className="ml-auto h-4 w-4" />
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                    <DropdownMenuGroup>
                        {orgs.map((org) => (
                            <DropdownMenuItem
                                key={org.id}
                                onSelect={() => handleSelectOrg(org.id)}
                                className="cursor-pointer"
                            >
                                <Building2 className="mr-2 h-4 w-4" />
                                {org.name}
                                {currentOrgId === org.id && (
                                    <Check className="ml-auto h-4 w-4" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    {canManageWorkspace ? (
                        <DropdownMenuItem onSelect={() => setShowCreateDialog(true)} className="cursor-pointer">
                            <Plus className="mr-2 h-4 w-4" />
                            Créer une équipe
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onSelect={() => navigate("/pricing")} className="cursor-pointer text-muted-foreground">
                            <Lock className="mr-2 h-3.5 w-3.5" />
                            Créer une équipe
                            <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded">Business</span>
                        </DropdownMenuItem>
                    )}
                    {canManageWorkspace && currentOrgId !== 'personal' && currentOrg && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => navigate(`/org/${currentOrgId}/settings`)} className="cursor-pointer">
                                <Building2 className="mr-2 h-4 w-4" />
                                Gérer l'équipe
                            </DropdownMenuItem>
                        </>
                    )}

                </DropdownMenuContent>
            </DropdownMenu>

            {canManageWorkspace && (
                <CreateOrgDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    onSuccess={handleCreateSuccess}
                    accessToken={session.access_token}
                />
            )}
        </>
    );
}
