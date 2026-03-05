const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'locales', 'fr.json');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
    "Le generateur PowerPoint IA pour creer vos presentations automatiquement": "Le générateur PowerPoint IA pour créer vos présentations automatiquement",
    "SlideAI est l'outil IA presentation pour creer un PowerPoint avec IA, generer une presentation automatiquement et livrer vos slides plus vite.": "SlideAI est l'outil IA présentation pour créer un PowerPoint avec IA, générer une présentation automatiquement et livrer vos slides plus vite.",
    "Demarrer l'essai 7 jours": "Démarrer l'essai 7 jours",
    "Concu pour cabinets de conseil, audit, marketing et freelances": "Conçu pour cabinets de conseil, audit, marketing et freelances",
    "Jusqu'a plusieurs heures gagnees par mission": "Jusqu'à plusieurs heures gagnées par mission",
    "Comment creer un PowerPoint avec IA": "Comment créer un PowerPoint avec IA",
    "Pourquoi utiliser un outil IA presentation": "Pourquoi utiliser un outil IA présentation",
    "Generer une presentation automatiquement": "Générer une présentation automatiquement",
    "Creez votre premiere presentation en 30 secondes": "Créez votre première présentation en 30 secondes",
    "Comment SlideAI genere vos slides automatiquement": "Comment SlideAI génère vos slides automatiquement",
    "Un tableau de bord clair pour gerer vos presentations, regenerer des slides, ajuster le design et livrer sans friction.": "Un tableau de bord clair pour gérer vos présentations, régénérer des slides, ajuster le design et livrer sans friction.",
    "Testez l'outil IA presentation sur vos vrais livrables clients.": "Testez l'outil IA présentation sur vos vrais livrables clients.",
    "Generations de presentations pendant 7 jours": "Générations de présentations pendant 7 jours",
    "Annulation a tout moment": "Annulation à tout moment",
    "Chaque generation s'adapte au contenu, au client et au contexte. Meme sur une mission similaire, le livrable reste adapte.": "Chaque génération s'adapte au contenu, au client et au contexte. Même sur une mission similaire, le livrable reste adapté.",
    "Aucune carte demandee. Activez votre essai en moins de 30 secondes.": "Aucune carte demandée. Activez votre essai en moins de 30 secondes.",
    "Non. Vous pouvez utiliser le plan gratuit, demarrer un essai 7 jours sans carte, ou acheter un pack en paiement unique.": "Non. Vous pouvez utiliser le plan gratuit, démarrer un essai 7 jours sans carte, ou acheter un pack en paiement unique.",
    "Puis-je vraiment livrer ces slides a un client ?": "Puis-je vraiment livrer ces slides à un client ?",
    "Oui. Les slides sont concues pour un usage professionnel B2B.": "Oui. Les slides sont conçues pour un usage professionnel B2B.",
    "Non. Import -> generation -> ajustement -> livraison.": "Non. Import -> génération -> ajustement -> livraison.",
    "L'essai 7 jours demande-t-il une carte bancaire ?": "L'essai 7 jours demande-t-il une carte bancaire ?",
    "Non. Vous pouvez demarrer l'essai sans carte bancaire.": "Non. Vous pouvez démarrer l'essai sans carte bancaire.",
    "Mes documents clients sont-ils securises ?": "Mes documents clients sont-ils sécurisés ?",
    "Oui. Les donnees sont traitees de maniere securisee et en conformite RGPD.": "Oui. Les données sont traitées de manière sécurisée et en conformité RGPD.",
    "Demarrez votre essai gratuit de 7 jours.": "Démarrez votre essai gratuit de 7 jours."
};

for (const [bad, good] of Object.entries(replacements)) {
    content = content.replace(bad, good);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed accents in fr.json');
