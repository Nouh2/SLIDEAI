export interface Example {
  title: string;
  prompt: string;
  theme: string;
  thumbnail?: string;
  colorPalette?: {
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    text: string;
  };
  slides: any[];
}

export const examples: Example[] = [
  {
  "title": "Studio Arca : L'Architecture Biophilique",
  "prompt": "Crée une présentation pour Studio Arca, un cabinet d'architecture spécialisé dans le design biophilique, l'innovation durable et l'intégration de la nature dans les espaces urbains.",
  "theme": "creative-portfolio",
  "colorPalette": {
    "bg": "#ffffff",
    "text": "#000000",
    "accent": "#BFA181",
    "accent2": "#3E4C3F",
    "primary": "#607D5B",
    "surface": "#1E1E1E",
    "secondary": "#8D775F",
    "background": "#121212",
    "chartColors": [
      "#607D5B",
      "#8D775F",
      "#BFA181",
      "#4A5D4B",
      "#A69076"
    ],
    "textSecondary": "#A0A0A0"
  },
  "slides": [
    {
      "id": "slide-0",
      "type": "cover",
      "notes": "",
      "title": "Studio Arca",
      "layout": "cover",
      "bullets": [
        "Design Biophilique",
        "Durabilité Radicalle",
        "Innovation Matérielle"
      ],
      "content": {
        "bullets": [
          "Design Biophilique",
          "Durabilité Radicalle",
          "Innovation Matérielle"
        ],
        "subtitle": "Redéfinir l'espace urbain par l'harmonie organique"
      },
      "subtitle": "Redéfinir l'espace urbain par l'harmonie organique",
      "variation": "diagonal-hero",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1761971976102-b40c536e873c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "modern minimalist biophilic architecture concrete and plants"
    },
    {
      "id": "slide-1",
      "type": "image-focus",
      "notes": "",
      "title": "Notre Vision : La Nature dans le Béton",
      "layout": "image-focus",
      "bullets": [],
      "content": {
        "subtitle": "Nous ne construisons pas simplement des bâtiments ; nous cultivons des écosystèmes habitables où la structure brute rencontre le souffle du vivant."
      },
      "subtitle": "Nous ne construisons pas simplement des bâtiments ; nous cultivons des écosystèmes habitables où la structure brute rencontre le souffle du vivant.",
      "variation": "default",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1676151804658-5f361a7c6a44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "moss growing on concrete wall architecture interior"
    },
    {
      "id": "slide-2",
      "type": "bento",
      "items": [
        {
          "title": "Lumière Naturelle",
          "description": "Optimisation de l'exposition solaire pour réduire la consommation d'énergie de 30% tout en améliorant le bien-être des occupants."
        },
        {
          "title": "Écosystèmes Intégrés",
          "description": "Intégration de flore locale directement dans les façades et les intérieurs pour purifier l'air et réguler la température."
        },
        {
          "title": "Matériaux Circulaires",
          "description": "Utilisation de béton bas carbone et de composants recyclés pour minimiser l'empreinte environnementale de chaque projet."
        }
      ],
      "notes": "",
      "title": "Nos Piliers de Conception",
      "layout": "bento",
      "bullets": [],
      "content": {
        "items": [
          {
            "title": "Lumière Naturelle",
            "description": "Optimisation de l'exposition solaire pour réduire la consommation d'énergie de 30% tout en améliorant le bien-être des occupants."
          },
          {
            "title": "Écosystèmes Intégrés",
            "description": "Intégration de flore locale directement dans les façades et les intérieurs pour purifier l'air et réguler la température."
          },
          {
            "title": "Matériaux Circulaires",
            "description": "Utilisation de béton bas carbone et de composants recyclés pour minimiser l'empreinte environnementale de chaque projet."
          }
        ]
      },
      "variation": "magazine-grid",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1581808384616-8448a6a94603?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "architectural sketches sustainable design"
    },
    {
      "id": "slide-3",
      "type": "comparison",
      "notes": "",
      "title": "Villa Éco-Norvège : Intégration vs Impact",
      "layout": "comparison",
      "bullets": [],
      "content": {
        "leftTitle": "Approche Traditionnelle",
        "rightTitle": "L'Approche Studio Arca",
        "leftBullets": [
          "Excavation massive du terrain",
          "Matériaux importés à forte empreinte",
          "Isolation synthétique standard",
          "Paysage environnant perturbé"
        ],
        "rightBullets": [
          "Structure sur pilotis respectant la topographie",
          "Bois local et pierre de récupération",
          "Toiture végétalisée isolante",
          "Zéro perturbation de la biodiversité"
        ]
      },
      "variation": "before-after",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1611170789382-98965a71a9f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "modern scandinavian villa forest snow"
    },
    {
      "id": "slide-4",
      "type": "chart",
      "notes": "",
      "title": "Jardin Vertical de Singapour : Impact Thermique",
      "layout": "chart",
      "bullets": [],
      "content": {
        "labels": [
          "08:00",
          "12:00",
          "16:00",
          "20:00"
        ],
        "datasets": [
          {
            "data": [
              28,
              34,
              33,
              29
            ],
            "label": "Température Extérieure (°C)"
          },
          {
            "data": [
              24,
              26,
              26,
              25
            ],
            "label": "Température Intérieure Arca (°C)"
          }
        ],
        "chartType": "line",
        "description": "Notre système de façade vivante permet une réduction naturelle de la température intérieure de 7°C en moyenne sans climatisation."
      },
      "description": "Notre système de façade vivante permet une réduction naturelle de la température intérieure de 7°C en moyenne sans climatisation.",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1589848014556-68829c7a3cf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "singapore vertical garden skyscraper green facade"
    },
    {
      "id": "slide-5",
      "type": "text-columns",
      "notes": "",
      "title": "Le Musée du Bois au Japon",
      "layout": "text-columns",
      "bullets": [],
      "columns": [
        {
          "text": "Inspiré par les techniques d'assemblage traditionnelles japonaises, ce musée utilise des jointures sans clous, célébrant l'artisanat ancestral tout en assurant une flexibilité sismique exceptionnelle.",
          "title": "Héritage et Tradition"
        },
        {
          "text": "Nous avons utilisé du bois lamellé-croisé (CLT) issu de forêts gérées durablement pour créer des portées impressionnantes qui défient la gravité sans l'usage d'acier lourd.",
          "title": "Innovation Structurelle"
        },
        {
          "text": "Le design favorise l'olfaction et l'acoustique naturelle du cèdre, créant une atmosphère de sérénité qui réduit le stress des visiteurs dès leur entrée dans le hall principal.",
          "title": "Expérience Sensorielle"
        }
      ],
      "content": {
        "columns": [
          {
            "text": "Inspiré par les techniques d'assemblage traditionnelles japonaises, ce musée utilise des jointures sans clous, célébrant l'artisanat ancestral tout en assurant une flexibilité sismique exceptionnelle.",
            "title": "Héritage et Tradition"
          },
          {
            "text": "Nous avons utilisé du bois lamellé-croisé (CLT) issu de forêts gérées durablement pour créer des portées impressionnantes qui défient la gravité sans l'usage d'acier lourd.",
            "title": "Innovation Structurelle"
          },
          {
            "text": "Le design favorise l'olfaction et l'acoustique naturelle du cèdre, créant une atmosphère de sérénité qui réduit le stress des visiteurs dès leur entrée dans le hall principal.",
            "title": "Expérience Sensorielle"
          }
        ]
      },
      "variation": "numbered-editorial",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1708068976064-00db5dbff919?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "modern japanese wood architecture museum interior"
    },
    {
      "id": "slide-6",
      "type": "infographic",
      "notes": "",
      "title": "Cycle de Vie de nos Matériaux Recyclés",
      "layout": "infographic",
      "bullets": [],
      "content": {
        "steps": [
          {
            "title": "Collecte",
            "description": "Récupération de débris de construction et déchets industriels locaux."
          },
          {
            "title": "Transformation",
            "description": "Broyage et mélange avec des liants biosourcés pour créer le 'Béton Arca'."
          },
          {
            "title": "Application",
            "description": "Moulage de structures préfabriquées à faible émission de CO2."
          },
          {
            "title": "Régénération",
            "description": "En fin de vie, nos matériaux sont 100% concassables pour de nouveaux projets."
          }
        ]
      },
      "variation": "hub-spoke",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1627121972535-5c1e86ad7f2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "recycled construction materials texture"
    },
    {
      "id": "slide-7",
      "type": "bullets",
      "notes": "",
      "title": "L'Équipe de Designers",
      "layout": "bullets",
      "bullets": [
        "Elena Vance - Directrice du Design Biophilique (Ex-MIT)",
        "Kenji Sato - Expert en Structures Bois et Traditions Japonaises",
        "Marc Dupont - Ingénieur en Matériaux Circulaires",
        "Sofia Rossi - Architecte Paysagiste et Écologue"
      ],
      "content": {
        "bullets": [
          "Elena Vance - Directrice du Design Biophilique (Ex-MIT)",
          "Kenji Sato - Expert en Structures Bois et Traditions Japonaises",
          "Marc Dupont - Ingénieur en Matériaux Circulaires",
          "Sofia Rossi - Architecte Paysagiste et Écologue"
        ],
        "subtitle": "Une synergie d'experts passionnés par le futur de l'habitat."
      },
      "subtitle": "Une synergie d'experts passionnés par le futur de l'habitat.",
      "variation": "split-card",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1585611957690-772d8fd3cf1a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "diverse architecture team working in studio"
    },
    {
      "id": "slide-8",
      "type": "stats",
      "notes": "",
      "stats": [
        {
          "label": "Empreinte Carbone vs Standard",
          "value": "-45%"
        },
        {
          "label": "Prix Internationaux d'Architecture",
          "value": "12"
        },
        {
          "label": "m² de Forêts Urbaines Créés",
          "value": "150k"
        },
        {
          "label": "Matériaux Biosourcés ou Recyclés",
          "value": "100%"
        }
      ],
      "title": "Notre Impact en Chiffres",
      "layout": "stats",
      "bullets": [],
      "content": {
        "stats": [
          {
            "label": "Empreinte Carbone vs Standard",
            "value": "-45%"
          },
          {
            "label": "Prix Internationaux d'Architecture",
            "value": "12"
          },
          {
            "label": "m² de Forêts Urbaines Créés",
            "value": "150k"
          },
          {
            "label": "Matériaux Biosourcés ou Recyclés",
            "value": "100%"
          }
        ]
      },
      "variation": "big-hero-stat",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1568874985260-222730ceffbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "sustainable city aerial view green roofs"
    },
    {
      "id": "slide-9",
      "type": "section",
      "notes": "",
      "title": "Construisons le Futur Ensemble",
      "layout": "section",
      "bullets": [
        "Consultation Stratégique",
        "Conception Architecturale",
        "Audit de Durabilité"
      ],
      "content": {
        "bullets": [
          "Consultation Stratégique",
          "Conception Architecturale",
          "Audit de Durabilité"
        ],
        "subtitle": "Contactez Studio Arca pour vos projets de demain. \n\n hello@studioarca.com | +33 1 23 45 67 89"
      },
      "subtitle": "Contactez Studio Arca pour vos projets de demain. \n\n hello@studioarca.com | +33 1 23 45 67 89",
      "variation": "big-number-outline",
      "illustration": {
        "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
        "type": "icon",
        "iconName": "Sparkles"
      },
      "backgroundImage": "https://images.unsplash.com/photo-1653840691670-db2eb01355ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjY5NjYwODN8&ixlib=rb-4.1.0&q=80&w=1080",
      "imageSearchQuery": "architect handshake sustainable building site"
    }
  ]
},
  {
    "title": "Lancement Stratégique SlideAI B2B Europe 2026",
    "prompt": "Génère une présentation stratégique pour le lancement B2B de SlideAI en Europe",
    "theme": "consulting",
    "colorPalette": {
      "bg": "#F4F4F4",
      "text": "#1A1A1A",
      "accent": "#D4AF37",
      "primary": "#003366",
      "secondary": "#8E1B1B"
    },
    "slides": [
      {
        "id": "slide-0",
        "type": "cover",
        "notes": "",
        "title": "Stratégie d'Expansion SlideAI : Horizon 2026",
        "layout": "cover",
        "bullets": [
          "Analyse stratégique B2B",
          "Objectif 5M€ ARR",
          "Roadmap d'implémentation"
        ],
        "content": {
          "bullets": [
            "Analyse stratégique B2B",
            "Objectif 5M€ ARR",
            "Roadmap d'implémentation"
          ],
          "subtitle": "Conquérir le marché Enterprise européen par l'intelligence créative."
        },
        "subtitle": "Conquérir le marché Enterprise européen par l'intelligence créative.",
        "variation": "full-split",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1654292541857-9d5a6d8f3ef3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "professional business skyscraper london architecture"
      },
      {
        "id": "slide-1",
        "type": "section",
        "notes": "",
        "title": "Synthèse Exécutive",
        "layout": "section",
        "bullets": [],
        "content": {
          "subtitle": "Transformer la communication corporate par l'automatisation intelligente."
        },
        "subtitle": "Transformer la communication corporate par l'automatisation intelligente.",
        "variation": "minimal-bar",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1739854711158-d4dee8460f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "executive meeting room minimalist"
      },
      {
        "id": "slide-2",
        "type": "text-columns",
        "notes": "",
        "title": "Le Paradoxe de la Productivité en Europe",
        "layout": "text-columns",
        "bullets": [],
        "columns": [
          {
            "text": "Les cadres européens passent en moyenne 12 heures par semaine sur la création de supports visuels. Cette perte de temps opérationnelle freine l'innovation et la prise de décision rapide dans les grands groupes du CAC 40 et du DAX.",
            "title": "Le Problème Actuel"
          },
          {
            "text": "SlideAI réduit ce temps de 80% en transformant des données brutes en narrations visuelles sophistiquées, respectant scrupuleusement les chartes graphiques complexes des entreprises internationales.",
            "title": "L'Opportunité SlideAI"
          },
          {
            "text": "D'ici 2026, SlideAI ne sera plus un outil d'assistance, mais le moteur central de la communication stratégique pour les départements de conseil et de direction financière en Europe.",
            "title": "Vision Stratégique"
          }
        ],
        "content": {
          "columns": [
            {
              "text": "Les cadres européens passent en moyenne 12 heures par semaine sur la création de supports visuels. Cette perte de temps opérationnelle freine l'innovation et la prise de décision rapide dans les grands groupes du CAC 40 et du DAX.",
              "title": "Le Problème Actuel"
            },
            {
              "text": "SlideAI réduit ce temps de 80% en transformant des données brutes en narrations visuelles sophistiquées, respectant scrupuleusement les chartes graphiques complexes des entreprises internationales.",
              "title": "L'Opportunité SlideAI"
            },
            {
              "text": "D'ici 2026, SlideAI ne sera plus un outil d'assistance, mais le moteur central de la communication stratégique pour les départements de conseil et de direction financière en Europe.",
              "title": "Vision Stratégique"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1700241956197-0b13f96fd69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "busy office workers data overload"
      },
      {
        "id": "slide-3",
        "type": "chart",
        "chart": {
          "type": "bar",
          "title": "",
          "series": [
            {
              "data": [
                450,
                120,
                15
              ],
              "name": "Marché en Millions d'Euros"
            }
          ],
          "categories": [
            "TAM (Total)",
            "SAM (Serviceable)",
            "SOM (Target 2026)"
          ]
        },
        "notes": "",
        "title": "Potentiel du Marché Européen (TAM/SAM)",
        "layout": "chart",
        "bullets": [],
        "content": {
          "chart": {
            "type": "bar",
            "title": "",
            "series": [
              {
                "data": [
                  450,
                  120,
                  15
                ],
                "name": "Marché en Millions d'Euros"
              }
            ],
            "categories": [
              "TAM (Total)",
              "SAM (Serviceable)",
              "SOM (Target 2026)"
            ]
          },
          "description": "Analyse du marché des logiciels de productivité bureautique en Europe de l'Ouest, avec un focus sur les solutions SaaS Enterprise."
        },
        "description": "Analyse du marché des logiciels de productivité bureautique en Europe de l'Ouest, avec un focus sur les solutions SaaS Enterprise.",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "financial data chart analysis"
      },
      {
        "id": "slide-4",
        "type": "comparison",
        "notes": "",
        "title": "Paysage Concurrentiel : SlideAI vs Incumbents",
        "layout": "comparison",
        "bullets": [],
        "content": {
          "comparison": {
            "left": {
              "items": [
                "Processus manuel et chronophage",
                "Difficulté de maintien de la charte",
                "Pas d'intelligence contextuelle",
                "Coût caché lié au temps de travail"
              ],
              "title": "Solutions Traditionnelles (PowerPoint/Canva)"
            },
            "right": {
              "items": [
                "Génération instantanée via IA",
                "Respect strict du 'Brand Identity'",
                "Analyse de données intégrée",
                "ROI mesurable dès le premier mois"
              ],
              "title": "SlideAI (L'avantage disruptif)"
            }
          }
        },
        "comparison": {
          "left": {
            "items": [
              "Processus manuel et chronophage",
              "Difficulté de maintien de la charte",
              "Pas d'intelligence contextuelle",
              "Coût caché lié au temps de travail"
            ],
            "title": "Solutions Traditionnelles (PowerPoint/Canva)"
          },
          "right": {
            "items": [
              "Génération instantanée via IA",
              "Respect strict du 'Brand Identity'",
              "Analyse de données intégrée",
              "ROI mesurable dès le premier mois"
            ],
            "title": "SlideAI (L'avantage disruptif)"
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1760979112371-3d7e2ebd3dd5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "chess game strategy competition"
      },
      {
        "id": "slide-5",
        "type": "stats",
        "notes": "",
        "stats": [
          {
            "label": "Revenu Annuel Récurrent (ARR)",
            "value": "5M€"
          },
          {
            "label": "Comptes Entreprise Actifs",
            "value": "150+"
          },
          {
            "label": "Taux de Rétention (NRR)",
            "value": "115%"
          },
          {
            "label": "Pays Européens Couverts",
            "value": "12"
          }
        ],
        "title": "Objectifs de Croissance 2024-2026",
        "layout": "stats",
        "bullets": [],
        "content": {
          "stats": [
            {
              "label": "Revenu Annuel Récurrent (ARR)",
              "value": "5M€"
            },
            {
              "label": "Comptes Entreprise Actifs",
              "value": "150+"
            },
            {
              "label": "Taux de Rétention (NRR)",
              "value": "115%"
            },
            {
              "label": "Pays Européens Couverts",
              "value": "12"
            }
          ]
        },
        "variation": "data-progress",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1537325251977-c4d30a40cede?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "growth arrow success"
      },
      {
        "id": "slide-6",
        "type": "chart",
        "chart": {
          "type": "line",
          "title": "",
          "series": [
            {
              "data": [
                0.8,
                1.4,
                2.1,
                3,
                4.2,
                5.1
              ],
              "name": "ARR Cumulé (M€)"
            }
          ],
          "categories": [
            "Q1 2025",
            "Q2 2025",
            "Q3 2025",
            "Q4 2025",
            "Q1 2026",
            "Q2 2026"
          ]
        },
        "notes": "",
        "title": "Trajectoire de Revenus Prévisionnelle",
        "layout": "chart",
        "bullets": [],
        "content": {
          "chart": {
            "type": "line",
            "title": "",
            "series": [
              {
                "data": [
                  0.8,
                  1.4,
                  2.1,
                  3,
                  4.2,
                  5.1
                ],
                "name": "ARR Cumulé (M€)"
              }
            ],
            "categories": [
              "Q1 2025",
              "Q2 2025",
              "Q3 2025",
              "Q4 2025",
              "Q1 2026",
              "Q2 2026"
            ]
          },
          "description": "Projection basée sur un cycle de vente moyen de 4 mois pour les comptes Enterprise."
        },
        "description": "Projection basée sur un cycle de vente moyen de 4 mois pour les comptes Enterprise.",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1501864626935-8f8452e07087?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "ascending graph business growth"
      },
      {
        "id": "slide-7",
        "type": "bento",
        "items": [
          {
            "title": "Cabinets de Conseil",
            "description": "Optimisation de la production de livrables clients. Focus sur la rapidité et la précision analytique pour McKinsey, BCG et Big Four."
          },
          {
            "title": "Services Financiers",
            "description": "Automatisation des rapports trimestriels et des decks de fusion-acquisition. Sécurité des données de niveau bancaire requise."
          },
          {
            "title": "Secteur Pharma & Tech",
            "description": "Présentation de données complexes de R&D et roadmaps produits. Besoin de visualisation de données sophistiquée."
          },
          {
            "title": "Directions Marketing",
            "description": "Maintien de la cohérence de marque sur l'ensemble des filiales européennes avec des templates dynamiques."
          }
        ],
        "notes": "",
        "title": "Segments de Marché Prioritaires",
        "layout": "bento",
        "bullets": [],
        "content": {
          "items": [
            {
              "title": "Cabinets de Conseil",
              "description": "Optimisation de la production de livrables clients. Focus sur la rapidité et la précision analytique pour McKinsey, BCG et Big Four."
            },
            {
              "title": "Services Financiers",
              "description": "Automatisation des rapports trimestriels et des decks de fusion-acquisition. Sécurité des données de niveau bancaire requise."
            },
            {
              "title": "Secteur Pharma & Tech",
              "description": "Présentation de données complexes de R&D et roadmaps produits. Besoin de visualisation de données sophistiquée."
            },
            {
              "title": "Directions Marketing",
              "description": "Maintien de la cohérence de marque sur l'ensemble des filiales européennes avec des templates dynamiques."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1760329708963-6f4cf2d61f54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "industry sectors icons blue"
      },
      {
        "id": "slide-8",
        "type": "infographic",
        "notes": "",
        "title": "Framework de Déploiement 'Scale-up'",
        "layout": "infographic",
        "bullets": [],
        "content": {
          "type": "process",
          "steps": [
            {
              "title": "Standardisation",
              "description": "Audit des actifs de marque et intégration des templates maîtres dans l'IA."
            },
            {
              "title": "Synergie",
              "description": "Déploiement pilote sur un département clé (ex: Stratégie) pour valider le ROI."
            },
            {
              "title": "Scaling",
              "description": "Expansion horizontale à l'ensemble de l'organisation avec support dédié."
            }
          ]
        },
        "variation": "process",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1662827179167-8918f239eda4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "gears process flow diagram"
      },
      {
        "id": "slide-9",
        "type": "table",
        "notes": "",
        "table": {
          "rows": [
            [
              "Ventes (Sales)",
              "Account Executives",
              "8",
              "DACH, France, UK"
            ],
            [
              "Engineering",
              "AI Specialists / DevOps",
              "6",
              "Remote / Hub Berlin"
            ],
            [
              "Customer Success",
              "Enterprise Managers",
              "4",
              "Pan-Européen"
            ],
            [
              "Marketing",
              "B2B Demand Gen",
              "2",
              "Siège Social"
            ]
          ],
          "columns": [
            "Département",
            "Rôles Clés",
            "Nombre",
            "Focus Régional"
          ]
        },
        "title": "Plan de Recrutement Stratégique",
        "layout": "table",
        "bullets": [],
        "content": {
          "rows": [
            [
              "Ventes (Sales)",
              "Account Executives",
              "8",
              "DACH, France, UK"
            ],
            [
              "Engineering",
              "AI Specialists / DevOps",
              "6",
              "Remote / Hub Berlin"
            ],
            [
              "Customer Success",
              "Enterprise Managers",
              "4",
              "Pan-Européen"
            ],
            [
              "Marketing",
              "B2B Demand Gen",
              "2",
              "Siège Social"
            ]
          ],
          "table": {
            "rows": [
              [
                "Ventes (Sales)",
                "Account Executives",
                "8",
                "DACH, France, UK"
              ],
              [
                "Engineering",
                "AI Specialists / DevOps",
                "6",
                "Remote / Hub Berlin"
              ],
              [
                "Customer Success",
                "Enterprise Managers",
                "4",
                "Pan-Européen"
              ],
              [
                "Marketing",
                "B2B Demand Gen",
                "2",
                "Siège Social"
              ]
            ],
            "columns": [
              "Département",
              "Rôles Clés",
              "Nombre",
              "Focus Régional"
            ]
          }
        },
        "variation": "default",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1758518729058-dc2b362dd1ba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "hiring team interview"
      },
      {
        "id": "slide-10",
        "type": "timeline",
        "items": [
          {
            "date": "Mars 2025",
            "event": "Lancement API Enterprise & Connecteurs BI (Tableau/PowerBI)."
          },
          {
            "date": "Juin 2025",
            "event": "Certification Sécurité ISO 27001 et conformité RGPD avancée."
          },
          {
            "date": "Octobre 2025",
            "event": "Moteur IA Multi-modal (Text-to-Design 2.0) avec gestion de la voix."
          },
          {
            "date": "Janvier 2026",
            "event": "Collaboration en temps réel assistée par agent IA autonome."
          }
        ],
        "notes": "",
        "title": "Jalons Technologiques 2025-2026",
        "layout": "timeline",
        "bullets": [],
        "content": {
          "items": [
            {
              "date": "Mars 2025",
              "event": "Lancement API Enterprise & Connecteurs BI (Tableau/PowerBI)."
            },
            {
              "date": "Juin 2025",
              "event": "Certification Sécurité ISO 27001 et conformité RGPD avancée."
            },
            {
              "date": "Octobre 2025",
              "event": "Moteur IA Multi-modal (Text-to-Design 2.0) avec gestion de la voix."
            },
            {
              "date": "Janvier 2026",
              "event": "Collaboration en temps réel assistée par agent IA autonome."
            }
          ],
          "timeline": {
            "items": [
              {
                "date": "Mars 2025",
                "title": "Lancement API Enterprise & Connecteurs BI (Tableau/PowerBI).",
                "description": ""
              },
              {
                "date": "Juin 2025",
                "title": "Certification Sécurité ISO 27001 et conformité RGPD avancée.",
                "description": ""
              },
              {
                "date": "Octobre 2025",
                "title": "Moteur IA Multi-modal (Text-to-Design 2.0) avec gestion de la voix.",
                "description": ""
              },
              {
                "date": "Janvier 2026",
                "title": "Collaboration en temps réel assistée par agent IA autonome.",
                "description": ""
              }
            ]
          }
        },
        "timeline": {
          "items": [
            {
              "date": "Mars 2025",
              "title": "Lancement API Enterprise & Connecteurs BI (Tableau/PowerBI).",
              "description": ""
            },
            {
              "date": "Juin 2025",
              "title": "Certification Sécurité ISO 27001 et conformité RGPD avancée.",
              "description": ""
            },
            {
              "date": "Octobre 2025",
              "title": "Moteur IA Multi-modal (Text-to-Design 2.0) avec gestion de la voix.",
              "description": ""
            },
            {
              "date": "Janvier 2026",
              "title": "Collaboration en temps réel assistée par agent IA autonome.",
              "description": ""
            }
          ]
        },
        "variation": "horizontal-line",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1731458769726-cef60c792665?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "technology digital roadmap"
      },
      {
        "id": "slide-11",
        "type": "timeline",
        "items": [
          {
            "date": "Mois 1-3",
            "event": "Phase d'amorçage : Recrutement de la core team Sales Europe et setup infrastructure."
          },
          {
            "date": "Mois 4-6",
            "event": "Expansion : Signature des 5 premiers comptes 'Lighthouse' (CAC 40 / DAX)."
          },
          {
            "date": "Mois 7-9",
            "event": "Optimisation : Lancement des fonctionnalités de collaboration d'équipe avancées."
          },
          {
            "date": "Mois 10-12",
            "event": "Accélération : Campagne marketing agressive et préparation du round Series B."
          }
        ],
        "notes": "",
        "title": "Roadmap d'Implémentation sur 12 Mois",
        "layout": "timeline",
        "bullets": [],
        "content": {
          "items": [
            {
              "date": "Mois 1-3",
              "event": "Phase d'amorçage : Recrutement de la core team Sales Europe et setup infrastructure."
            },
            {
              "date": "Mois 4-6",
              "event": "Expansion : Signature des 5 premiers comptes 'Lighthouse' (CAC 40 / DAX)."
            },
            {
              "date": "Mois 7-9",
              "event": "Optimisation : Lancement des fonctionnalités de collaboration d'équipe avancées."
            },
            {
              "date": "Mois 10-12",
              "event": "Accélération : Campagne marketing agressive et préparation du round Series B."
            }
          ],
          "timeline": {
            "items": [
              {
                "date": "Mois 1-3",
                "title": "Phase d'amorçage : Recrutement de la core team Sales Europe et setup infrastructure.",
                "description": ""
              },
              {
                "date": "Mois 4-6",
                "title": "Expansion : Signature des 5 premiers comptes 'Lighthouse' (CAC 40 / DAX).",
                "description": ""
              },
              {
                "date": "Mois 7-9",
                "title": "Optimisation : Lancement des fonctionnalités de collaboration d'équipe avancées.",
                "description": ""
              },
              {
                "date": "Mois 10-12",
                "title": "Accélération : Campagne marketing agressive et préparation du round Series B.",
                "description": ""
              }
            ]
          }
        },
        "timeline": {
          "items": [
            {
              "date": "Mois 1-3",
              "title": "Phase d'amorçage : Recrutement de la core team Sales Europe et setup infrastructure.",
              "description": ""
            },
            {
              "date": "Mois 4-6",
              "title": "Expansion : Signature des 5 premiers comptes 'Lighthouse' (CAC 40 / DAX).",
              "description": ""
            },
            {
              "date": "Mois 7-9",
              "title": "Optimisation : Lancement des fonctionnalités de collaboration d'équipe avancées.",
              "description": ""
            },
            {
              "date": "Mois 10-12",
              "title": "Accélération : Campagne marketing agressive et préparation du round Series B.",
              "description": ""
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1714974528718-b3b52f91c334?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "calendar planning strategy"
      },
      {
        "id": "slide-12",
        "type": "table",
        "notes": "",
        "table": {
          "rows": [
            [
              "Souveraineté des données",
              "Élevé",
              "Hébergement local (EU) et chiffrement de bout en bout."
            ],
            [
              "Adoption utilisateur",
              "Moyen",
              "Programme de formation 'Champion' et UI ultra-intuitive."
            ],
            [
              "Concurrence Big Tech",
              "Élevé",
              "Focus sur la personnalisation extrême de la charte graphique."
            ]
          ],
          "columns": [
            "Risque Identifié",
            "Impact",
            "Stratégie d'Atténuation"
          ]
        },
        "title": "Analyse des Risques et Atténuation",
        "layout": "table",
        "bullets": [],
        "content": {
          "rows": [
            [
              "Souveraineté des données",
              "Élevé",
              "Hébergement local (EU) et chiffrement de bout en bout."
            ],
            [
              "Adoption utilisateur",
              "Moyen",
              "Programme de formation 'Champion' et UI ultra-intuitive."
            ],
            [
              "Concurrence Big Tech",
              "Élevé",
              "Focus sur la personnalisation extrême de la charte graphique."
            ]
          ],
          "table": {
            "rows": [
              [
                "Souveraineté des données",
                "Élevé",
                "Hébergement local (EU) et chiffrement de bout en bout."
              ],
              [
                "Adoption utilisateur",
                "Moyen",
                "Programme de formation 'Champion' et UI ultra-intuitive."
              ],
              [
                "Concurrence Big Tech",
                "Élevé",
                "Focus sur la personnalisation extrême de la charte graphique."
              ]
            ],
            "columns": [
              "Risque Identifié",
              "Impact",
              "Stratégie d'Atténuation"
            ]
          }
        },
        "variation": "default",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1536427214932-ca1936622ac8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "risk management shield"
      },
      {
        "id": "slide-13",
        "type": "image-focus",
        "notes": "",
        "title": "Devenir le Standard Européen",
        "layout": "image-focus",
        "bullets": [
          "Innovation continue",
          "Excellence opérationnelle",
          "Partenariat de confiance"
        ],
        "content": {
          "bullets": [
            "Innovation continue",
            "Excellence opérationnelle",
            "Partenariat de confiance"
          ],
          "subtitle": "Notre mission est d'éliminer la friction entre l'idée et la présentation pour chaque entreprise en Europe."
        },
        "subtitle": "Notre mission est d'éliminer la friction entre l'idée et la présentation pour chaque entreprise en Europe.",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1624280632518-be20a5aad19a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "futuristic office vision digital"
      },
      {
        "id": "slide-14",
        "type": "section",
        "notes": "",
        "title": "Prochaines Étapes & Questions",
        "layout": "section",
        "bullets": [],
        "content": {
          "subtitle": "Contact : direction-strategie@slideai.com | Session Q&A"
        },
        "subtitle": "Contact : direction-strategie@slideai.com | Session Q&A",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1587160499277-93516d190743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NjcyMTc1ODF8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "handshake business deal"
      }
    ]
  }
];
