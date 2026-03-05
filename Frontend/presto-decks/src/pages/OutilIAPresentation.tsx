import { BusinessSeoLanding } from "@/components/seo/BusinessSeoLanding";

export default function OutilIAPresentation() {
  return (
    <BusinessSeoLanding
      title="Outil IA presentation"
      description="Un outil IA presentation pour structurer, generer et finaliser plus vite vos slides PowerPoint dans un contexte B2B."
      h1="L'outil IA presentation pour vos slides PowerPoint B2B"
      intro="Si vous cherchez un outil IA presentation pour accelerer la creation de vos supports clients, SlideAI vous aide a passer du brief au deck en quelques minutes. L'outil est adapte aux usages conseil, audit, marketing et freelance."
      url="/outil-ia-presentation"
      keyword="outil ia presentation"
      secondaryKeyword="generer une presentation automatiquement"
      useCases={[
        "Equipes conseil qui produisent plusieurs decks par semaine",
        "Audits clients et restitutions executifs",
        "Directions marketing et plans d'action trimestriels",
        "Freelances qui veulent livrer plus vite avec un meilleur niveau de finition",
      ]}
      benefits={[
        "Generer une presentation automatiquement a partir d'un sujet ou document",
        "Clarifier la structure avant de travailler le detail",
        "Produire des supports plus homogenes d'une mission a l'autre",
        "Acceder a un workflow simple jusqu'a l'export PowerPoint",
      ]}
      howItWorks={[
        "Vous donnez le contexte, les objectifs et les grandes idees.",
        "L'outil propose un deck organise, avec sections et angles de traitement.",
        "Vous ajustez le contenu, le style et exportez le support final.",
      ]}
    />
  );
}
