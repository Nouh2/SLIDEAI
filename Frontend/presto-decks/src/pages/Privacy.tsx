export default function Privacy() {
  return (
    <div className="container py-20">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-[var(--muted)]">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
          </p>
        </div>

        <div className="space-y-6 text-[var(--text)]">
          <div>
            <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-[var(--muted)]">
              SlideAI s'engage à protéger vos données personnelles. Cette politique de confidentialité 
              décrit comment nous collectons, utilisons et protégeons vos informations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">2. Données collectées</h2>
            <p className="text-[var(--muted)] mb-2">Nous collectons les informations suivantes :</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
              <li>Informations de compte (nom, email)</li>
              <li>Contenu de vos présentations</li>
              <li>Données d'utilisation et analytics</li>
              <li>Informations de paiement (via Stripe)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">3. Utilisation des données</h2>
            <p className="text-[var(--muted)] mb-2">Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
              <li>Fournir et améliorer nos services</li>
              <li>Générer vos présentations avec l'IA</li>
              <li>Gérer votre abonnement</li>
              <li>Vous contacter concernant nos services</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">4. Partage des données</h2>
            <p className="text-[var(--muted)] mb-2">
              Nous ne vendons jamais vos données. Nous les partageons uniquement avec :
            </p>
            <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
              <li>Nos prestataires de services (hébergement, paiement)</li>
              <li>Les autorités légales si requis par la loi</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">5. Vos droits</h2>
            <p className="text-[var(--muted)] mb-2">Vous avez le droit de :</p>
            <ul className="list-disc list-inside space-y-1 text-[var(--muted)]">
              <li>Accéder à vos données personnelles</li>
              <li>Corriger vos données</li>
              <li>Supprimer votre compte et vos données</li>
              <li>Exporter vos données</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">6. Contact</h2>
            <p className="text-[var(--muted)]">
              Pour toute question concernant cette politique de confidentialité, contactez-nous à :<br />
              <a href="mailto:privacy@slideai.com" className="text-[var(--primary)] hover:text-[var(--secondary)] transition-colors">
                privacy@slideai.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
