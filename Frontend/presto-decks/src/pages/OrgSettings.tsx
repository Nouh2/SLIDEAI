import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Trash2, UserPlus, Loader2 } from "lucide-react";
import { hasFeature } from "@/lib/subscription";
import { UpgradeGate } from "@/components/common/UpgradeGate";

interface Member {
    userId: string;
    role: string;
    user: {
        email: string;
        name?: string;
    }
}

export default function OrgSettings() {
    const { orgId } = useParams<{ orgId: string }>();
    const { session } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<Member[]>([]);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<any>(null);

    useEffect(() => {
        const loadMembers = async () => {
            if (!session?.access_token || !orgId) return;
            try {
                const subscriptionData = await api.getMySubscription(session.access_token).catch(() => null);
                setSubscription(subscriptionData);
                if (!hasFeature(subscriptionData, "team_workspace")) {
                    return;
                }

                const data = await api.getOrgMembers(orgId, session.access_token);
                setMembers(data);
            } catch (err) {
                console.error("Failed to load members", err);
                setError(t('orgSettings.loadError'));
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, [orgId, session?.access_token]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.access_token || !orgId) return;

        setInviteLoading(true);
        setError(null);

        try { // Hardcoded role 'member' for now
            await api.addMember(orgId, newMemberEmail, 'member', session.access_token);
            setNewMemberEmail("");
            // Refetch members
            const data = await api.getOrgMembers(orgId, session.access_token);
            setMembers(data);
        } catch (err: any) {
            console.error("Failed to invite member", err);
            setError(err.message || t('orgSettings.inviteError'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!session?.access_token || !orgId) return;
        if (!confirm(t('orgSettings.removeConfirm'))) return;

        try {
            await api.removeMember(orgId, userId, session.access_token);
            setMembers(members.filter(m => m.userId !== userId));
        } catch (err) {
            console.error("Failed to remove member", err);
            setError("Failed to remove member");
        }
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!hasFeature(subscription, "team_workspace")) {
        return (
            <div className="container mx-auto py-10">
                <UpgradeGate
                    title="Team workspace required"
                    description="Organization creation and member management are available on the Team plan."
                    cta="View plans"
                    onUpgrade={() => navigate("/pricing")}
                />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('orgSettings.title')}</h1>
                <p className="text-muted-foreground">{t('orgSettings.subtitle')}</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('orgSettings.inviteMembers')}</CardTitle>
                    <CardDescription>
                        {t('orgSettings.inviteDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleInvite} className="flex gap-4 items-end">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                type="email"
                                placeholder="colleague@example.com"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={inviteLoading}>
                            {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <UserPlus className="mr-2 h-4 w-4" />
                            {t('orgSettings.invite')}
                        </Button>
                    </form>
                    {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('orgSettings.members')}</CardTitle>
                    <CardDescription>
                        {t('orgSettings.membersDesc')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('orgSettings.email')}</TableHead>
                                <TableHead>{t('orgSettings.role')}</TableHead>
                                <TableHead className="text-right">{t('orgSettings.actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.map((member) => (
                                <TableRow key={member.userId}>
                                    <TableCell>{member.user.email}</TableCell>
                                    <TableCell className="capitalize">{member.role}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveMember(member.userId)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
