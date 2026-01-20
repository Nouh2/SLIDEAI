import React from 'react';

export default function GdprPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl space-y-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Conformité RGPD
            </h1>
            <p className="text-muted-foreground text-sm">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

            <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Engagement de SlideAI</h2>
                    <p>
                        SlideAI s'engage à respecter le Règlement Général sur la Protection des Données (RGPD) de l'Union Européenne.
                        Nous plaçons la protection de vos données personnelles au cœur de notre conception (Privacy by Design).
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Vos Droits RGPD</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border border-border/50 rounded-lg bg-surface/50">
                            <h3 className="font-semibold text-primary mb-2">Droit d'accès</h3>
                            <p className="text-sm">Vous pouvez demander une copie de toutes les données personnelles que nous détenons sur vous.</p>
                        </div>
                        <div className="p-4 border border-border/50 rounded-lg bg-surface/50">
                            <h3 className="font-semibold text-primary mb-2">Droit à l'oubli</h3>
                            <p className="text-sm">Vous pouvez demander la suppression totale de votre compte et de toutes les données associées.</p>
                        </div>
                        <div className="p-4 border border-border/50 rounded-lg bg-surface/50">
                            <h3 className="font-semibold text-primary mb-2">Droit à la portabilité</h3>
                            <p className="text-sm">Vous pouvez récupérer vos données dans un format structuré et lisible par machine (export JSON de vos présentations).</p>
                        </div>
                        <div className="p-4 border border-border/50 rounded-lg bg-surface/50">
                            <h3 className="font-semibold text-primary mb-2">Droit de rectification</h3>
                            <p className="text-sm">Vous pouvez modifier vos informations personnelles directement depuis votre espace compte.</p>
                        </div>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Sous-traitants et Transferts de Données</h2>
                    <p>
                        Nous travaillons avec des partenaires de confiance qui respectent également le RGPD :
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Hébergement :</strong> Supabase (Données stockées de manière sécurisée).</li>
                        <li><strong>Intelligence Artificielle :</strong> Google Cloud Platform (Vertex AI). Nous avons signé des clauses contractuelles types garantissant un niveau de protection adéquat.</li>
                        <li><strong>Paiement :</strong> Stripe (pour la gestion sécurisée des abonnements).</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">Délégué à la Protection des Données (DPO)</h2>
                    <p>
                        Pour toute question relative à vos données personnelles ou pour exercer vos droits, vous pouvez contacter notre Délégué à la Protection des Données à l'adresse suivante :
                    </p>
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20 inline-block">
                        <span className="font-mono text-primary">contact@slideai.fr</span>
                    </div>
                </section>
            </div>
        </div>
    );
}
