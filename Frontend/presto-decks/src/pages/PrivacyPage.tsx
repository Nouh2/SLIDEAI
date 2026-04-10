import React from 'react';
import { SEO } from "@/components/common/SEO";

export default function PrivacyPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl space-y-8">
            <SEO
                title="Politique de confidentialite"
                description="Consultez la politique de confidentialite de SlideAI et le traitement des donnees utilisees par la plateforme."
                url="/privacy"
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Politique de Confidentialité
            </h1>
            <p className="text-muted-foreground text-sm">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

            <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">1. Collecte des Données</h2>
                    <p>
                        Dans le cadre de l'utilisation de SlideAI, nous collectons les informations suivantes :
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Informations de compte :</strong> Email, nom d'utilisateur.</li>
                        <li><strong>Contenu utilisateur :</strong> Les documents importés, les prompts textuels, et les présentations générées.</li>
                        <li><strong>Données techniques :</strong> Logs de connexion, adresse IP, cookies pour l'authentification.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">2. Utilisation des Données</h2>
                    <p>
                        Nous utilisons vos données pour :
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>Fournir et améliorer le service de génération de présentations.</li>
                        <li>Gérer votre compte et vos abonnements.</li>
                        <li>Assurer le support technique.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">3. Partage des Données et IA</h2>
                    <p>
                        Pour fournir notre service "Génération par IA", nous transmettons vos prompts et contenus textuels à nos fournisseurs de modèles d'IA tiers (Google Cloud Vertex AI).
                        Ces données sont utilisées uniquement pour générer votre résultat et ne sont pas utilisées par ces tiers pour entraîner leurs modèles publics, conformément à leurs engagements de confidentialité pour les entreprises.
                        Nous ne vendons aucune de vos données personnelles.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">4. Sécurité</h2>
                    <p>
                        Nous mettons en œuvre des mesures de sécurité techniques (chiffrement TLS, stockage sécurisé via Supabase) pour protéger vos données contre l'accès non autorisé.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">5. Conservation des Données</h2>
                    <p>
                        Vos présentations et données associées sont conservées tant que votre compte est actif. Vous pouvez supprimer vos présentations à tout moment depuis votre tableau de bord.
                        La suppression est définitive.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">6. Vos Droits</h2>
                    <p>
                        Conformément à la réglementation, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                        Pour exercer ces droits, vous pouvez nous contacter à l'adresse email de support indiquée sur le site ou supprimer directement votre compte depuis les paramètres.
                    </p>
                </section>
            </div>
        </div>
    );
}
