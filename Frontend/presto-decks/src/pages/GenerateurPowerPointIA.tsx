import { BusinessSeoLanding } from "@/components/seo/BusinessSeoLanding";

export default function GenerateurPowerPointIA() {
  return (
    <BusinessSeoLanding
      title="Generateur PowerPoint IA"
      description="Le generateur PowerPoint IA pour creer des presentations professionnelles plus vite, avec export PowerPoint et workflow adapte au B2B."
      h1="Le generateur PowerPoint IA pour creer vos presentations plus vite"
      intro="SlideAI est un generateur PowerPoint IA concu pour les consultants, equipes marketing, freelances et profils B2B qui passent leurs journees dans PowerPoint. Vous decrivez votre sujet, l'outil structure les slides, puis vous ajustez avant livraison."
      url="/generateur-powerpoint-ia"
      keyword="generateur powerpoint ia"
      secondaryKeyword="outil IA presentation"
      useCases={[
        "Consultants RH, SEO, strategie et audit",
        "Directeurs marketing et equipes growth",
        "Freelances qui livrent des recommandations clients",
        "Equipes B2B qui doivent produire des decks chaque semaine",
      ]}
      benefits={[
        "Gagner plusieurs heures par semaine sur PowerPoint",
        "Obtenir une structure de deck plus claire des le premier jet",
        "Uniformiser la qualite des supports avant livraison",
        "Exporter rapidement en PPTX ou PDF",
      ]}
      howItWorks={[
        "Decrivez la presentation ou importez votre document de travail.",
        "L'IA genere une base de deck structuree et exploitable.",
        "Vous ajustez le message, le design et exportez le fichier final.",
      ]}
    />
  );
}
