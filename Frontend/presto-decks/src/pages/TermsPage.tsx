import React from 'react';

export default function TermsPage() {
    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl space-y-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Conditions Générales d'Utilisation
            </h1>
            <p className="text-muted-foreground text-sm">Dernière mise à jour : {new Date().toLocaleDateString()}</p>

            <div className="prose prose-invert max-w-none space-y-6 text-foreground/80">
                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">1. Objet</h2>
                    <p>
                        Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme SlideAI.
                        En accédant ou en utilisant nos services, vous acceptez d'être lié par ces conditions.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description du Service</h2>
                    <p>
                        SlideAI est un outil assisté par intelligence artificielle (IA) permettant de générer des présentations à partir de texte ou de documents.
                        Le service utilise des modèles d'IA tiers (comme Google Gemini) pour générer du contenu.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">3. Utilisation de l'IA et Responsabilité</h2>
                    <p>
                        Le contenu généré par l'IA est proposé à titre indicatif. L'utilisateur reconnaît que l'IA peut parfois produire des informations inexactes (hallucinations).
                        Il est de la seule responsabilité de l'utilisateur de vérifier, corriger et valider tout le contenu généré avant son utilisation ou sa diffusion.
                        SlideAI ne peut être tenu responsable des erreurs ou omissions dans les présentations générées.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">4. Compte Utilisateur</h2>
                    <p>
                        L'accès à certaines fonctionnalités nécessite la création d'un compte. Vous êtes responsable du maintien de la confidentialité de vos identifiants.
                        Toute activité effectuée sous votre compte relève de votre responsabilité.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">5. Propriété Intellectuelle</h2>
                    <ul className="list-disc pl-5 space-y-2">
                        <li><strong>Contenu généré :</strong> Vous conservez les droits sur les présentations que vous créez et exportez via la plateforme, sous réserve des droits des tiers sur les images ou contenus sources.</li>
                        <li><strong>Plateforme :</strong> SlideAI détient tous les droits de propriété intellectuelle sur l'interface, le code, et la marque SlideAI.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation de Responsabilité</h2>
                    <p>
                        Le service est fourni "tel quel". Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs.
                        En aucun cas SlideAI ne sera responsable des dommages indirects, pertes de données ou pertes financières résultant de l'utilisation du service.
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-foreground mb-4">7. Modification des Conditions</h2>
                    <p>
                        Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication sur le site.
                    </p>
                </section>
            </div>
        </div>
    );
}
