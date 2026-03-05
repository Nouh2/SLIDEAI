import json

def fix_french_typos(text):
    if not isinstance(text, str):
        return text
    replacements = {
        'equipes': 'équipes',
        'Meme ': 'Même ',
        'adapte': 'adapté',
        'presentations': 'présentations',
        'creer': 'créer',
        'des la ': 'dès la ',
        'generation': 'génération',
        'securisez': 'sécurisez',
        'securise': 'sécurisé',
        'Creez': 'Créez',
        'premiere': 'première',
        'presentation': 'présentation',
        'Demarrer': 'Démarrer',
        'regulier': 'régulier',
        'Passez a ': 'Passez à ',
        'complique': 'compliqué',
        'a utiliser': 'à utiliser',
        'deja': 'déjà',
        'Concu': 'Conçu',
        'Securise': 'Sécurisé',
        'Donnees': 'Données',
        'chiffrees': 'chiffrées',
        'Pret': 'Prêt',
        'Choisis': 'Choisissez',
        'tu ': 'vous ', # Careful with tu/vous, maybe the site uses vous? Yes. Wait, the site mixes.
        'Ton ': 'Votre ',
        'ton ': 'votre '
    }
    
    # We will do a word-boundary aware replacement or just direct? Direct might have false positives.
    # Actually, replacing without word boundaries for some words is fine.
    
    # Let's do exact phrase replacements instead to be safe.
    exact_replacements = {
        "Pour les equipes conseil": "Pour les équipes conseil",
        "Meme moteur IA, adapte aux": "Même moteur IA, adapté aux",
        "pour vos presentations": "pour vos présentations",
        "creer un PowerPoint": "créer un PowerPoint",
        "des la generation": "dès la génération",
        "Demarrer l'essai": "Démarrer l'essai",
        "securisez vos deadlines": "sécurisez vos deadlines",
        "Creez votre premiere": "Créez votre première",
        "Besoin regulier ? Passez a": "Besoin régulier ? Passez à",
        "Est-ce complique a utiliser ?": "Est-ce compliqué à utiliser ?",
        "Concu pour les equipes": "Conçu pour les équipes",
        "Donnees chiffrees": "Données chiffrées",
        "Paiement securise": "Paiement sécurisé",
        "tu peux créer": "vous pouvez créer", 
        "Importe ton document": "Importez votre document",
        "SlideAI génère le deck": "SlideAI génère le deck",
        "Ajuste et livre": "Ajustez et livrez",
        "Choisis le type": "Choisissez le type",
        "Tu livres souvent": "Vous livrez souvent",
        "Tu pourras ajuster": "Vous pourrez ajuster",
        "tes idées": "vos idées",
        "Ton document": "Votre document"
    }

    for bad, good in exact_replacements.items():
        text = text.replace(bad, good)
        
    return text

def process_dict(d):
    for k, v in list(d.items()):
        if isinstance(v, dict):
            process_dict(v)
        elif isinstance(v, str):
            d[k] = fix_french_typos(v)
        elif isinstance(v, list):
            d[k] = [fix_french_typos(i) if isinstance(i, str) else i for i in v]

with open('src/locales/fr.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

process_dict(data)

with open('src/locales/fr.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print("Typo fixes applied!")
