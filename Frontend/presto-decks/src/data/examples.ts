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
    "title": "Ethos Brew: Premium Organic Coffee Launch Strategy",
    "prompt": "Develop a comprehensive go-to-market strategy for the launch of Ethos Brew, a premium organic coffee brand.",
    "theme": "product-launch",
    "colorPalette": {
      "bg": "#FFFFFF",
      "text": "#1C1917",
      "accent": "#CA8A04",
      "primary": "#EA580C",
      "secondary": "#DC2626"
    },
    "slides": [
      {
        "id": "slide-0",
        "type": "cover",
        "notes": "",
        "title": "Revolutionizing the Organic Coffee Experience",
        "layout": "cover",
        "bullets": [],
        "content": {
          "subtitle": "Strategic Go-To-Market Framework for Ethos Brew 2024 Launch"
        },
        "subtitle": "Strategic Go-To-Market Framework for Ethos Brew 2024 Launch",
        "variation": "full-split",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1690983326662-51d73eac65fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMjB8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "premium organic coffee beans aesthetic",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@sergeykotenev",
          "name": "Sergey Kotenev",
          "username": "sergeykotenev"
        }
      },
      {
        "id": "slide-1",
        "type": "stats",
        "notes": "",
        "stats": [
          {
            "label": "Target market share in the premium organic segment within the first 18 months of national distribution.",
            "value": "15%"
          },
          {
            "label": "Projected gross revenue for Year 1, driven by a 60/40 split between DTC and retail partnerships.",
            "value": "$2.4M"
          },
          {
            "label": "Target active monthly subscribers for our 'Farm-to-Door' recurring delivery program by Q4.",
            "value": "45k"
          }
        ],
        "title": "Primary Launch Objectives & KPIs",
        "layout": "stats",
        "bullets": [],
        "content": {
          "stats": [
            {
              "label": "Target market share in the premium organic segment within the first 18 months of national distribution.",
              "value": "15%"
            },
            {
              "label": "Projected gross revenue for Year 1, driven by a 60/40 split between DTC and retail partnerships.",
              "value": "$2.4M"
            },
            {
              "label": "Target active monthly subscribers for our 'Farm-to-Door' recurring delivery program by Q4.",
              "value": "45k"
            }
          ]
        },
        "variation": "big-hero-stat",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1640249259042-e05d761d9b91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "growth success metrics",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@chuttersnap",
          "name": "CHUTTERSNAP",
          "username": "chuttersnap"
        }
      },
      {
        "id": "slide-2",
        "type": "text-columns",
        "notes": "",
        "title": "Market Context and Opportunity",
        "layout": "text-columns",
        "bullets": [],
        "columns": [
          {
            "text": "Consumer behavior is shifting radically toward ethical consumption. Modern coffee drinkers are no longer satisfied with just 'organic' labels; they demand radical transparency regarding soil health, carbon sequestration, and fair wages for farmers. Ethos Brew enters a market where the 'Specialty Bio' segment is growing at 3x the rate of traditional commercial coffee.",
            "title": "The Sustainable Shift"
          },
          {
            "text": "Despite economic fluctuations, the 'affordable luxury' category remains resilient. High-income urban professionals are increasingly investing in premium home-brewing equipment, creating a significant demand for high-altitude, single-origin beans that offer a cafe-quality experience without leaving the house.",
            "title": "Premiumization Trend"
          },
          {
            "text": "Current market leaders often sacrifice freshness for scale. By leveraging a 'Roasted-to-Order' logistics model, Ethos Brew can capitalize on the gap between mass-produced organic brands found in supermarkets and the hyper-local but hard-to-access specialty roasters.",
            "title": "Supply Chain Gaps"
          }
        ],
        "content": {
          "columns": [
            {
              "text": "Consumer behavior is shifting radically toward ethical consumption. Modern coffee drinkers are no longer satisfied with just 'organic' labels; they demand radical transparency regarding soil health, carbon sequestration, and fair wages for farmers. Ethos Brew enters a market where the 'Specialty Bio' segment is growing at 3x the rate of traditional commercial coffee.",
              "title": "The Sustainable Shift"
            },
            {
              "text": "Despite economic fluctuations, the 'affordable luxury' category remains resilient. High-income urban professionals are increasingly investing in premium home-brewing equipment, creating a significant demand for high-altitude, single-origin beans that offer a cafe-quality experience without leaving the house.",
              "title": "Premiumization Trend"
            },
            {
              "text": "Current market leaders often sacrifice freshness for scale. By leveraging a 'Roasted-to-Order' logistics model, Ethos Brew can capitalize on the gap between mass-produced organic brands found in supermarkets and the hyper-local but hard-to-access specialty roasters.",
              "title": "Supply Chain Gaps"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1768587955909-a211147ea223?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "sustainable coffee farming",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@allensamthomas",
          "name": "Allen Sam Thomas",
          "username": "allensamthomas"
        }
      },
      {
        "id": "slide-3",
        "type": "bento",
        "items": [
          {
            "title": "The Conscious Professional",
            "description": "Aged 28-45, earning $80k+. They value efficiency but refuse to compromise on ethics. They are likely to subscribe to a recurring delivery service to ensure their morning ritual is both high-quality and automated."
          },
          {
            "title": "The Eco-Warrior Parent",
            "description": "Prioritizes family health and environmental legacy. They shop at specialty grocers and are willing to pay a 20% premium for products that are certified plastic-free and chemical-free."
          },
          {
            "title": "The Gen-Z Taste-Maker",
            "description": "Driven by aesthetics and social proof. They discover brands via TikTok and Instagram. They value the 'story' behind the bean and are the primary drivers of our limited-edition seasonal drops."
          }
        ],
        "notes": "",
        "title": "Target Audience Segmentation",
        "layout": "bento",
        "bullets": [],
        "content": {
          "items": [
            {
              "title": "The Conscious Professional",
              "description": "Aged 28-45, earning $80k+. They value efficiency but refuse to compromise on ethics. They are likely to subscribe to a recurring delivery service to ensure their morning ritual is both high-quality and automated."
            },
            {
              "title": "The Eco-Warrior Parent",
              "description": "Prioritizes family health and environmental legacy. They shop at specialty grocers and are willing to pay a 20% premium for products that are certified plastic-free and chemical-free."
            },
            {
              "title": "The Gen-Z Taste-Maker",
              "description": "Driven by aesthetics and social proof. They discover brands via TikTok and Instagram. They value the 'story' behind the bean and are the primary drivers of our limited-edition seasonal drops."
            }
          ]
        },
        "variation": "asymmetric-masonry",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1626861932448-05d784a90058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "diverse people drinking coffee",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@emmaou",
          "name": "Emma Ou",
          "username": "emmaou"
        }
      },
      {
        "id": "slide-4",
        "type": "comparison",
        "notes": "",
        "title": "Competitive Positioning: Why Ethos Brew Wins",
        "layout": "comparison",
        "bullets": [],
        "content": {
          "comparison": {
            "left": {
              "items": [
                "Generic 'Organic' certification with vague sourcing",
                "Roasted months before appearing on retail shelves",
                "Standard plastic-lined multi-layer packaging",
                "Transactional relationship with no community focus"
              ],
              "title": "Traditional Organic Brands"
            },
            "right": {
              "items": [
                "Direct-trade partnerships with 100% farm traceability",
                "Guaranteed shipping within 48 hours of small-batch roasting",
                "Fully compostable, plant-based packaging solutions",
                "Active 'Impact Club' for subscriber-led charity voting"
              ],
              "title": "Ethos Brew Advantage"
            }
          }
        },
        "comparison": {
          "left": {
            "items": [
              "Generic 'Organic' certification with vague sourcing",
              "Roasted months before appearing on retail shelves",
              "Standard plastic-lined multi-layer packaging",
              "Transactional relationship with no community focus"
            ],
            "title": "Traditional Organic Brands"
          },
          "right": {
            "items": [
              "Direct-trade partnerships with 100% farm traceability",
              "Guaranteed shipping within 48 hours of small-batch roasting",
              "Fully compostable, plant-based packaging solutions",
              "Active 'Impact Club' for subscriber-led charity voting"
            ],
            "title": "Ethos Brew Advantage"
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1573883842376-2c9427e7955c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMjB8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "coffee quality comparison",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@halacious",
          "name": "Hal Gatewood",
          "username": "halacious"
        }
      },
      {
        "id": "slide-5",
        "type": "infographic",
        "notes": "",
        "title": "The Three Pillars of Brand Strategy",
        "layout": "infographic",
        "bullets": [],
        "content": {
          "infographic": {
            "type": "pyramid",
            "steps": [
              {
                "label": "Radical Quality",
                "value": "High-altitude, single-origin beans scored 85+ on the SCA scale."
              },
              {
                "label": "Ethical Circularity",
                "value": "Zero-waste supply chain from the farm gate to the customer's compost bin."
              },
              {
                "label": "Community Impact",
                "value": "Returning 5% of net profits directly to local farming infrastructure projects."
              }
            ]
          }
        },
        "variation": "cycle-flow",
        "infographic": {
          "type": "pyramid",
          "steps": [
            {
              "label": "Radical Quality",
              "value": "High-altitude, single-origin beans scored 85+ on the SCA scale."
            },
            {
              "label": "Ethical Circularity",
              "value": "Zero-waste supply chain from the farm gate to the customer's compost bin."
            },
            {
              "label": "Community Impact",
              "value": "Returning 5% of net profits directly to local farming infrastructure projects."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1748006708587-4b252a6e17fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMjB8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "strategy pillars concept",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@armorshop",
          "name": "Armor Shop",
          "username": "armorshop"
        }
      },
      {
        "id": "slide-6",
        "text": "We believe that the world's best coffee shouldn't cost the Earth. Our mission is to bridge the gap between world-class sensory experiences and uncompromising environmental stewardship, making every cup a catalyst for global change.",
        "type": "image-focus",
        "notes": "",
        "title": "Our Vision: A Greener Morning Ritual",
        "layout": "image-focus",
        "bullets": [],
        "content": {
          "text": "We believe that the world's best coffee shouldn't cost the Earth. Our mission is to bridge the gap between world-class sensory experiences and uncompromising environmental stewardship, making every cup a catalyst for global change."
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1601368367170-c9a2117827c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "beautiful coffee plantation sunrise",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@marjorylucabaxter",
          "name": "Lucie Hošová",
          "username": "marjorylucabaxter"
        }
      },
      {
        "id": "slide-7",
        "type": "table",
        "notes": "",
        "table": {
          "rows": [
            [
              "The Origin Series",
              "65%",
              "$18.50",
              "DTC / Subscription"
            ],
            [
              "The Heritage Blend",
              "55%",
              "$15.99",
              "Premium Retail / Grocery"
            ],
            [
              "Limited Reserve",
              "75%",
              "$28.00",
              "Exclusive Online Drops"
            ],
            [
              "Cold Brew Packs",
              "60%",
              "$22.00",
              "DTC / Boutique Cafes"
            ]
          ],
          "columns": [
            "Product Line",
            "Target Margin",
            "RRP (12oz Bag)",
            "Primary Channel"
          ]
        },
        "title": "Product Portfolio & Pricing Architecture",
        "layout": "table",
        "bullets": [],
        "content": {
          "table": {
            "rows": [
              [
                "The Origin Series",
                "65%",
                "$18.50",
                "DTC / Subscription"
              ],
              [
                "The Heritage Blend",
                "55%",
                "$15.99",
                "Premium Retail / Grocery"
              ],
              [
                "Limited Reserve",
                "75%",
                "$28.00",
                "Exclusive Online Drops"
              ],
              [
                "Cold Brew Packs",
                "60%",
                "$22.00",
                "DTC / Boutique Cafes"
              ]
            ],
            "columns": [
              "Product Line",
              "Target Margin",
              "RRP (12oz Bag)",
              "Primary Channel"
            ]
          }
        },
        "variation": "data-grid",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=coffee%20bag%20packaging",
        "imageSearchQuery": "coffee bag packaging design"
      },
      {
        "id": "slide-8",
        "type": "infographic",
        "notes": "",
        "title": "The Marketing Conversion Funnel",
        "layout": "infographic",
        "bullets": [],
        "content": {
          "infographic": {
            "type": "funnel",
            "steps": [
              {
                "label": "Awareness",
                "value": "Influencer unboxing and educational social content."
              },
              {
                "label": "Consideration",
                "value": "Personalized 'Taste Profile' quiz on our website."
              },
              {
                "label": "Conversion",
                "value": "Introductory 'Starter Kit' with 30% off first month."
              },
              {
                "label": "Loyalty",
                "value": "Impact Club membership and early access to reserves."
              }
            ]
          }
        },
        "variation": "process",
        "infographic": {
          "type": "funnel",
          "steps": [
            {
              "label": "Awareness",
              "value": "Influencer unboxing and educational social content."
            },
            {
              "label": "Consideration",
              "value": "Personalized 'Taste Profile' quiz on our website."
            },
            {
              "label": "Conversion",
              "value": "Introductory 'Starter Kit' with 30% off first month."
            },
            {
              "label": "Loyalty",
              "value": "Impact Club membership and early access to reserves."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1758876201791-eb6e137b2b39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "marketing funnel concept",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@silverkblack",
          "name": "Vitaly Gariev",
          "username": "silverkblack"
        }
      },
      {
        "id": "slide-9",
        "type": "timeline",
        "notes": "",
        "title": "12-Month Launch Roadmap",
        "layout": "timeline",
        "bullets": [],
        "content": {
          "timeline": {
            "items": [
              {
                "date": "Q1 2024",
                "title": "Infrastructure & Sourcing",
                "description": "Finalize direct-trade contracts with Ethiopian and Colombian cooperatives; launch beta website for pre-orders."
              },
              {
                "date": "Q2 2024",
                "title": "Soft Launch & DTC",
                "description": "Official launch of the e-commerce platform; focus on micro-influencer partnerships and SEO content."
              },
              {
                "date": "Q3 2024",
                "title": "Retail Expansion",
                "description": "Rollout into 150+ premium organic grocery stores in metropolitan hubs; launch 'Ethos on Tap' for offices."
              },
              {
                "date": "Q4 2024",
                "title": "Scaling & Optimization",
                "description": "Launch of the mobile app; international shipping expansion to Canada and the UK; Year-end impact report."
              }
            ]
          }
        },
        "timeline": {
          "items": [
            {
              "date": "Q1 2024",
              "title": "Infrastructure & Sourcing",
              "description": "Finalize direct-trade contracts with Ethiopian and Colombian cooperatives; launch beta website for pre-orders."
            },
            {
              "date": "Q2 2024",
              "title": "Soft Launch & DTC",
              "description": "Official launch of the e-commerce platform; focus on micro-influencer partnerships and SEO content."
            },
            {
              "date": "Q3 2024",
              "title": "Retail Expansion",
              "description": "Rollout into 150+ premium organic grocery stores in metropolitan hubs; launch 'Ethos on Tap' for offices."
            },
            {
              "date": "Q4 2024",
              "title": "Scaling & Optimization",
              "description": "Launch of the mobile app; international shipping expansion to Canada and the UK; Year-end impact report."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=project%20timeline%20pla",
        "imageSearchQuery": "project timeline planning"
      },
      {
        "id": "slide-10",
        "type": "bullets",
        "notes": "",
        "title": "Multi-Channel Distribution Strategy",
        "layout": "bullets",
        "bullets": [
          "Direct-to-Consumer (DTC): Our primary high-margin channel focusing on recurring revenue through customizable subscription tiers.",
          "Selective Retail: Partnering exclusively with high-end organic grocers like Whole Foods and independent health food boutiques.",
          "B2B Office Solutions: Providing 'Sustainable Office' packages including compostable pods and bulk beans for corporate wellness programs.",
          "Boutique Hospitality: Exclusive partnerships with 5-star eco-resorts and high-end cafes to build brand prestige and drive trial."
        ],
        "content": {
          "bullets": [
            "Direct-to-Consumer (DTC): Our primary high-margin channel focusing on recurring revenue through customizable subscription tiers.",
            "Selective Retail: Partnering exclusively with high-end organic grocers like Whole Foods and independent health food boutiques.",
            "B2B Office Solutions: Providing 'Sustainable Office' packages including compostable pods and bulk beans for corporate wellness programs.",
            "Boutique Hospitality: Exclusive partnerships with 5-star eco-resorts and high-end cafes to build brand prestige and drive trial."
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1726137569911-bc03e55fd87f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIyMTl8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "coffee shop and retail display",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@sumup",
          "name": "SumUp",
          "username": "sumup"
        }
      },
      {
        "id": "slide-11",
        "type": "chart",
        "chart": {
          "type": "line",
          "title": "Projected Monthly Revenue by Channel ($)",
          "series": [
            {
              "data": [
                20000,
                45000,
                85000,
                140000,
                190000,
                250000
              ],
              "name": "DTC Revenue"
            },
            {
              "data": [
                5000,
                15000,
                40000,
                90000,
                130000,
                180000
              ],
              "name": "Retail Revenue"
            }
          ],
          "categories": [
            "Jan",
            "Mar",
            "May",
            "Jul",
            "Sep",
            "Nov"
          ]
        },
        "notes": "",
        "title": "Year 1 Revenue Growth Projections",
        "layout": "chart",
        "bullets": [],
        "content": {
          "chart": {
            "type": "line",
            "title": "Projected Monthly Revenue by Channel ($)",
            "series": [
              {
                "data": [
                  20000,
                  45000,
                  85000,
                  140000,
                  190000,
                  250000
                ],
                "name": "DTC Revenue"
              },
              {
                "data": [
                  5000,
                  15000,
                  40000,
                  90000,
                  130000,
                  180000
                ],
                "name": "Retail Revenue"
              }
            ],
            "categories": [
              "Jan",
              "Mar",
              "May",
              "Jul",
              "Sep",
              "Nov"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=business%20growth%20char",
        "imageSearchQuery": "business growth chart"
      },
      {
        "id": "slide-12",
        "type": "chart",
        "chart": {
          "type": "donut",
          "title": "Strategic Spend Distribution",
          "series": [
            {
              "data": [
                35,
                25,
                15,
                15,
                10
              ],
              "name": "Budget Share"
            }
          ],
          "categories": [
            "Paid Social",
            "Influencers",
            "Content Production",
            "Events/Sampling",
            "SEO/PR"
          ]
        },
        "notes": "",
        "title": "Marketing Budget Allocation",
        "layout": "chart",
        "bullets": [],
        "content": {
          "chart": {
            "type": "donut",
            "title": "Strategic Spend Distribution",
            "series": [
              {
                "data": [
                  35,
                  25,
                  15,
                  15,
                  10
                ],
                "name": "Budget Share"
              }
            ],
            "categories": [
              "Paid Social",
              "Influencers",
              "Content Production",
              "Events/Sampling",
              "SEO/PR"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=budget%20allocation%20pi",
        "imageSearchQuery": "budget allocation pie chart"
      },
      {
        "id": "slide-13-1769512347762",
        "title": "Our Journey Begins",
        "layout": "image-focus",
        "bullets": [],
        "content": {
          "text": "Our strategy is set, our vision is clear, and the market is ready. We invite you to join us as we redefine the premium coffee experience and brew a more conscious future for everyone.",
          "subtitle": "Ethos Brew: Sustainable. Premium. Organic."
        },
        "variation": "split-curtain",
        "backgroundImage": "https://images.unsplash.com/photo-1661328993179-777ad80cd245?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIzNDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "morning coffee sun rays sustainable farm",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@hi_tshdz",
          "name": "Tshedza Muvhango",
          "username": "hi_tshdz"
        }
      }
    ]
  },
  {
    "title": "Audit de Performance Web : Client XYZ",
    "prompt": "Réaliser un audit technique et SEO complet du site web de Client XYZ avec recommandations stratégiques.",
    "theme": "corporate-report",
    "colorPalette": {
      "bg": "#FFFFFF",
      "text": "#1E293B",
      "accent": "#D97706",
      "primary": "#0369A1",
      "secondary": "#059669"
    },
    "slides": [
      {
        "id": "slide-0",
        "text": "Ce document présente les résultats détaillés de l'audit technique, UX et SEO réalisé sur les plateformes web du Client XYZ, visant à identifier les leviers de croissance immédiats.",
        "type": "cover",
        "notes": "",
        "title": "Audit de Performance Web Stratégique",
        "layout": "cover",
        "bullets": [],
        "content": {
          "text": "Ce document présente les résultats détaillés de l'audit technique, UX et SEO réalisé sur les plateformes web du Client XYZ, visant à identifier les leviers de croissance immédiats.",
          "subtitle": "Analyse exhaustive de l'écosystème digital et recommandations d'optimisation pour le Client XYZ - Q3 2023"
        },
        "subtitle": "Analyse exhaustive de l'écosystème digital et recommandations d'optimisation pour le Client XYZ - Q3 2023",
        "variation": "typographic-giant",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1714974528704-befac88c2fd6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "professional business report office laptop",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@silverkblack",
          "name": "Vitaly Gariev",
          "username": "silverkblack"
        }
      },
      {
        "id": "slide-1",
        "type": "text-columns",
        "notes": "",
        "title": "Périmètre et Méthodologie de l'Audit",
        "layout": "text-columns",
        "bullets": [],
        "columns": [
          {
            "text": "Nous avons utilisé une suite d'outils de pointe incluant Google Lighthouse pour la performance technique, Screaming Frog pour l'exploration SEO sémantique, et Hotjar pour l'analyse comportementale des utilisateurs réels sur le site. Cette approche multi-facettes permet de croiser les données théoriques avec l'expérience vécue par vos clients.",
            "title": "Outils de Diagnostic"
          },
          {
            "text": "L'audit couvre l'intégralité du tunnel de conversion, de la page d'accueil aux pages produits, jusqu'au processus de paiement. Une attention particulière a été portée sur la version mobile qui représente aujourd'hui 65% de votre trafic global, ainsi que sur les temps de réponse serveurs lors des pics d'affluence simulés.",
            "title": "Segments Analysés"
          },
          {
            "text": "L'analyse ne se limite pas à la technique ; elle est orientée vers vos KPIs métiers. L'objectif final est d'augmenter le taux de conversion global de 15% et de réduire le taux d'abandon au panier en identifiant les frictions psychologiques et techniques qui freinent actuellement vos utilisateurs.",
            "title": "Objectifs Business"
          }
        ],
        "content": {
          "columns": [
            {
              "text": "Nous avons utilisé une suite d'outils de pointe incluant Google Lighthouse pour la performance technique, Screaming Frog pour l'exploration SEO sémantique, et Hotjar pour l'analyse comportementale des utilisateurs réels sur le site. Cette approche multi-facettes permet de croiser les données théoriques avec l'expérience vécue par vos clients.",
              "title": "Outils de Diagnostic"
            },
            {
              "text": "L'audit couvre l'intégralité du tunnel de conversion, de la page d'accueil aux pages produits, jusqu'au processus de paiement. Une attention particulière a été portée sur la version mobile qui représente aujourd'hui 65% de votre trafic global, ainsi que sur les temps de réponse serveurs lors des pics d'affluence simulés.",
              "title": "Segments Analysés"
            },
            {
              "text": "L'analyse ne se limite pas à la technique ; elle est orientée vers vos KPIs métiers. L'objectif final est d'augmenter le taux de conversion global de 15% et de réduire le taux d'abandon au panier en identifiant les frictions psychologiques et techniques qui freinent actuellement vos utilisateurs.",
              "title": "Objectifs Business"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1551135049-8a33b5883817?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "data analysis methodology",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@officestock",
          "name": "Sebastian Herrmann",
          "username": "officestock"
        }
      },
      {
        "id": "slide-2",
        "type": "stats",
        "notes": "",
        "stats": [
          {
            "label": "Largest Contentful Paint (LCP) moyen, dépassant le seuil recommandé de 2.5s pour une expérience fluide.",
            "value": "4.2s"
          },
          {
            "label": "Taux de rebond moyen sur les pages d'entrée, signalant un manque d'engagement immédiat.",
            "value": "58%"
          },
          {
            "label": "Score d'optimisation SEO global, révélant des lacunes critiques sur la structure des données.",
            "value": "65/100"
          },
          {
            "label": "Taux de conversion actuel, nettement inférieur à la moyenne sectorielle fixée à 2.8%.",
            "value": "1.2%"
          }
        ],
        "title": "Indicateurs de Performance Actuels (KPIs)",
        "layout": "stats",
        "bullets": [],
        "content": {
          "stats": [
            {
              "label": "Largest Contentful Paint (LCP) moyen, dépassant le seuil recommandé de 2.5s pour une expérience fluide.",
              "value": "4.2s"
            },
            {
              "label": "Taux de rebond moyen sur les pages d'entrée, signalant un manque d'engagement immédiat.",
              "value": "58%"
            },
            {
              "label": "Score d'optimisation SEO global, révélant des lacunes critiques sur la structure des données.",
              "value": "65/100"
            },
            {
              "label": "Taux de conversion actuel, nettement inférieur à la moyenne sectorielle fixée à 2.8%.",
              "value": "1.2%"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1590753684039-6adc03c5d6dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "dashboard analytics numbers",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@brunonw",
          "name": "bruno neurath-wilson",
          "username": "brunonw"
        }
      },
      {
        "id": "slide-3",
        "text": "On observe une dégradation progressive des performances sur les deux dernières semaines, coïncidant avec le déploiement de nouveaux scripts de tracking non optimisés.",
        "type": "chart",
        "chart": {
          "type": "line",
          "title": "Stabilité de la performance serveur sur le dernier mois",
          "series": [
            {
              "data": [
                3.8,
                4.5,
                4.2,
                4.8
              ],
              "name": "Temps de chargement (s)"
            }
          ],
          "categories": [
            "Semaine 1",
            "Semaine 2",
            "Semaine 3",
            "Semaine 4"
          ]
        },
        "notes": "",
        "title": "Évolution du Temps de Chargement (30 Jours)",
        "layout": "chart",
        "bullets": [],
        "content": {
          "text": "On observe une dégradation progressive des performances sur les deux dernières semaines, coïncidant avec le déploiement de nouveaux scripts de tracking non optimisés.",
          "chart": {
            "type": "line",
            "title": "Stabilité de la performance serveur sur le dernier mois",
            "series": [
              {
                "data": [
                  3.8,
                  4.5,
                  4.2,
                  4.8
                ],
                "name": "Temps de chargement (s)"
              }
            ],
            "categories": [
              "Semaine 1",
              "Semaine 2",
              "Semaine 3",
              "Semaine 4"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1767788115794-0e93fb905016?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "line chart growth data",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@solidsolutionsenidentificationsa",
          "name": "Solid Solutions en Identification SA",
          "username": "solidsolutionsenidentificationsa"
        }
      },
      {
        "id": "slide-4",
        "type": "bento",
        "items": [
          {
            "title": "Navigation Complexe",
            "description": "Le menu principal présente trop de niveaux de profondeur, perdant l'utilisateur avant qu'il n'atteigne les catégories de produits clés. Une simplification de l'architecture est requise."
          },
          {
            "title": "CTA Peu Visibles",
            "description": "Les boutons d'appel à l'action manquent de contraste visuel par rapport au fond de page, ce qui dilue l'attention et réduit drastiquement le taux de clic sur les pages stratégiques."
          },
          {
            "title": "Formulaires Intrusifs",
            "description": "Le processus de création de compte demande trop d'informations non essentielles dès la première étape, provoquant un abandon massif de 40% des utilisateurs à ce stade précis."
          },
          {
            "title": "Interstitiels Mobiles",
            "description": "Les pop-ups promotionnelles sur mobile bloquent l'accès au contenu principal et pénalisent le score d'expérience utilisateur selon les critères de Google."
          }
        ],
        "notes": "",
        "title": "Points de Friction UX Identifiés",
        "layout": "bento",
        "bullets": [],
        "content": {
          "items": [
            {
              "title": "Navigation Complexe",
              "description": "Le menu principal présente trop de niveaux de profondeur, perdant l'utilisateur avant qu'il n'atteigne les catégories de produits clés. Une simplification de l'architecture est requise."
            },
            {
              "title": "CTA Peu Visibles",
              "description": "Les boutons d'appel à l'action manquent de contraste visuel par rapport au fond de page, ce qui dilue l'attention et réduit drastiquement le taux de clic sur les pages stratégiques."
            },
            {
              "title": "Formulaires Intrusifs",
              "description": "Le processus de création de compte demande trop d'informations non essentielles dès la première étape, provoquant un abandon massif de 40% des utilisateurs à ce stade précis."
            },
            {
              "title": "Interstitiels Mobiles",
              "description": "Les pop-ups promotionnelles sur mobile bloquent l'accès au contenu principal et pénalisent le score d'expérience utilisateur selon les critères de Google."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1607418554403-1d145ee448cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "user experience interface design",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@maximeutopix",
          "name": "Maxime",
          "username": "maximeutopix"
        }
      },
      {
        "id": "slide-5",
        "type": "bullets",
        "notes": "",
        "title": "Analyse du Référencement Naturel (SEO)",
        "layout": "bullets",
        "bullets": [
          "Optimisation sémantique insuffisante : Les balises Title et Meta-descriptions sont absentes ou dupliquées sur plus de 30% des pages indexées, limitant la visibilité sur les mots-clés stratégiques.",
          "Structure de maillage interne : Le site souffre d'un manque de liens internes entre les articles de blog et les pages produits, ce qui empêche la transmission de l'autorité SEO vers les pages de vente.",
          "Performances Core Web Vitals : Les scores actuels impactent négativement le classement dans les résultats de recherche mobile, Google privilégiant désormais les sites offrant une interactivité rapide.",
          "Contenu dupliqué identifié : Plusieurs versions des mêmes pages sont accessibles via différentes URLs, ce qui dilue le potentiel de classement et gaspille le budget de crawl des moteurs de recherche."
        ],
        "content": {
          "bullets": [
            "Optimisation sémantique insuffisante : Les balises Title et Meta-descriptions sont absentes ou dupliquées sur plus de 30% des pages indexées, limitant la visibilité sur les mots-clés stratégiques.",
            "Structure de maillage interne : Le site souffre d'un manque de liens internes entre les articles de blog et les pages produits, ce qui empêche la transmission de l'autorité SEO vers les pages de vente.",
            "Performances Core Web Vitals : Les scores actuels impactent négativement le classement dans les résultats de recherche mobile, Google privilégiant désormais les sites offrant une interactivité rapide.",
            "Contenu dupliqué identifié : Plusieurs versions des mêmes pages sont accessibles via différentes URLs, ce qui dilue le potentiel de classement et gaspille le budget de crawl des moteurs de recherche."
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1763038311036-6d18805537e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "search engine optimization concept",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@apexvirtualeducation",
          "name": "Apex Virtual Education",
          "username": "apexvirtualeducation"
        }
      },
      {
        "id": "slide-6",
        "text": "La chute la plus significative se situe entre la vue produit et l'ajout au panier. Cela indique un manque de réassurance ou des informations tarifaires (frais de port) trop tardives dans le parcours.",
        "type": "infographic",
        "notes": "",
        "title": "Entonnoir de Conversion : Analyse des Pertes",
        "layout": "infographic",
        "bullets": [],
        "content": {
          "text": "La chute la plus significative se situe entre la vue produit et l'ajout au panier. Cela indique un manque de réassurance ou des informations tarifaires (frais de port) trop tardives dans le parcours.",
          "infographic": {
            "type": "funnel",
            "steps": [
              {
                "label": "Visites Totales",
                "value": "100%"
              },
              {
                "label": "Vue Produit",
                "value": "45%"
              },
              {
                "label": "Ajout au Panier",
                "value": "12%"
              },
              {
                "label": "Paiement Validé",
                "value": "1.2%"
              }
            ]
          }
        },
        "infographic": {
          "type": "funnel",
          "steps": [
            {
              "label": "Visites Totales",
              "value": "100%"
            },
            {
              "label": "Vue Produit",
              "value": "45%"
            },
            {
              "label": "Ajout au Panier",
              "value": "12%"
            },
            {
              "label": "Paiement Validé",
              "value": "1.2%"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1567193729952-23830c0743ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "business funnel conversion",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@wonderlane",
          "name": "Wonderlane",
          "username": "wonderlane"
        }
      },
      {
        "id": "slide-7",
        "type": "comparison",
        "notes": "",
        "title": "Benchmarking : Client XYZ vs Leaders du Secteur",
        "layout": "comparison",
        "bullets": [],
        "content": {
          "comparison": {
            "left": {
              "items": [
                "Temps de chargement : 4.2s",
                "Accessibilité mobile : Limitée",
                "Taux de conversion : 1.2%",
                "Score de confiance : Moyen"
              ],
              "title": "Client XYZ",
              "subtitle": "Performance Actuelle"
            },
            "right": {
              "items": [
                "Temps de chargement : 1.8s",
                "Accessibilité mobile : Optimisée",
                "Taux de conversion : 3.1%",
                "Score de confiance : Élevé"
              ],
              "title": "Moyenne Top 3 Concurrents",
              "subtitle": "Standard de l'Industrie"
            }
          }
        },
        "comparison": {
          "left": {
            "items": [
              "Temps de chargement : 4.2s",
              "Accessibilité mobile : Limitée",
              "Taux de conversion : 1.2%",
              "Score de confiance : Moyen"
            ],
            "title": "Client XYZ",
            "subtitle": "Performance Actuelle"
          },
          "right": {
            "items": [
              "Temps de chargement : 1.8s",
              "Accessibilité mobile : Optimisée",
              "Taux de conversion : 3.1%",
              "Score de confiance : Élevé"
            ],
            "title": "Moyenne Top 3 Concurrents",
            "subtitle": "Standard de l'Industrie"
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1754304342491-6572d4bd2a03?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "competition analysis business",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@bkaraivanov",
          "name": "Bozhin Karaivanov",
          "username": "bkaraivanov"
        }
      },
      {
        "id": "slide-8",
        "text": "Malgré une domination écrasante du mobile, le taux de conversion y est deux fois plus faible que sur desktop, soulignant un besoin urgent d'optimisation de l'interface tactile.",
        "type": "chart",
        "chart": {
          "type": "pie",
          "title": "Le mobile est le canal prioritaire",
          "series": [
            {
              "data": [
                65,
                30,
                5
              ],
              "name": "Part du trafic"
            }
          ],
          "categories": [
            "Mobile",
            "Desktop",
            "Tablette"
          ]
        },
        "notes": "",
        "title": "Répartition du Trafic par Appareil",
        "layout": "chart",
        "bullets": [],
        "content": {
          "text": "Malgré une domination écrasante du mobile, le taux de conversion y est deux fois plus faible que sur desktop, soulignant un besoin urgent d'optimisation de l'interface tactile.",
          "chart": {
            "type": "pie",
            "title": "Le mobile est le canal prioritaire",
            "series": [
              {
                "data": [
                  65,
                  30,
                  5
                ],
                "name": "Part du trafic"
              }
            ],
            "categories": [
              "Mobile",
              "Desktop",
              "Tablette"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1543782465-24d9201afc74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "mobile vs desktop analytics",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@szabolcs",
          "name": "Szabolcs Varnai",
          "username": "szabolcs"
        }
      },
      {
        "id": "slide-9",
        "type": "table",
        "notes": "",
        "table": {
          "rows": [
            [
              "Images non compressées",
              "Très Élevé (Vitesse)",
              "Immédiate",
              "Faible"
            ],
            [
              "Scripts JS bloquants",
              "Élevé (Interactivité)",
              "Haute",
              "Moyenne"
            ],
            [
              "Processus de checkout long",
              "Critique (Conversion)",
              "Immédiate",
              "Élevée"
            ],
            [
              "Absence de HTTPS partiel",
              "Moyen (Sécurité/SEO)",
              "Haute",
              "Faible"
            ]
          ],
          "columns": [
            "Problème Identifié",
            "Impact Business",
            "Priorité",
            "Difficulté"
          ]
        },
        "title": "Matrice des Problèmes Critiques",
        "layout": "table",
        "bullets": [],
        "content": {
          "table": {
            "rows": [
              [
                "Images non compressées",
                "Très Élevé (Vitesse)",
                "Immédiate",
                "Faible"
              ],
              [
                "Scripts JS bloquants",
                "Élevé (Interactivité)",
                "Haute",
                "Moyenne"
              ],
              [
                "Processus de checkout long",
                "Critique (Conversion)",
                "Immédiate",
                "Élevée"
              ],
              [
                "Absence de HTTPS partiel",
                "Moyen (Sécurité/SEO)",
                "Haute",
                "Faible"
              ]
            ],
            "columns": [
              "Problème Identifié",
              "Impact Business",
              "Priorité",
              "Difficulté"
            ]
          }
        },
        "variation": "default",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1758876203326-016526a303a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "risk management table",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@silverkblack",
          "name": "Vitaly Gariev",
          "username": "silverkblack"
        }
      },
      {
        "id": "slide-10",
        "type": "bullets",
        "notes": "",
        "title": "Accessibilité et Conformité Digitale",
        "layout": "bullets",
        "bullets": [
          "Contraste des couleurs : Plusieurs zones de texte ne respectent pas les ratios de contraste WCAG, rendant la lecture difficile pour les utilisateurs malvoyants.",
          "Navigation au clavier : Le site est difficilement navigable sans souris, ce qui exclut une partie de l'audience et pose des risques de non-conformité légale.",
          "Attributs Alt manquants : La majorité des images ne possèdent pas de description textuelle, pénalisant à la fois l'accessibilité et le SEO d'image.",
          "Hiérarchie des titres (Hn) : La structure logique des titres est incohérente, ce qui perturbe les lecteurs d'écran et la compréhension sémantique par Google."
        ],
        "content": {
          "bullets": [
            "Contraste des couleurs : Plusieurs zones de texte ne respectent pas les ratios de contraste WCAG, rendant la lecture difficile pour les utilisateurs malvoyants.",
            "Navigation au clavier : Le site est difficilement navigable sans souris, ce qui exclut une partie de l'audience et pose des risques de non-conformité légale.",
            "Attributs Alt manquants : La majorité des images ne possèdent pas de description textuelle, pénalisant à la fois l'accessibilité et le SEO d'image.",
            "Hiérarchie des titres (Hn) : La structure logique des titres est incohérente, ce qui perturbe les lecteurs d'écran et la compréhension sémantique par Google."
          ]
        },
        "variation": "classic",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1712904116125-e82aaa92ea7f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "accessibility digital inclusion",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@walls_io",
          "name": "Walls.io",
          "username": "walls_io"
        }
      },
      {
        "id": "slide-11",
        "text": "Notre vision pour Client XYZ est de transformer ce site d'une simple vitrine en une plateforme de conversion haute performance, où chaque milliseconde de gagnée se traduit par une augmentation directe du chiffre d'affaires.",
        "type": "image-focus",
        "notes": "",
        "title": "Vers une Expérience Utilisateur Sans Friction",
        "layout": "image-focus",
        "bullets": [],
        "content": {
          "text": "Notre vision pour Client XYZ est de transformer ce site d'une simple vitrine en une plateforme de conversion haute performance, où chaque milliseconde de gagnée se traduit par une augmentation directe du chiffre d'affaires."
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=visionary%20technology",
        "imageSearchQuery": "visionary technology future"
      },
      {
        "id": "slide-12",
        "type": "timeline",
        "notes": "",
        "title": "Feuille de Route des Optimisations (Phase 1)",
        "layout": "timeline",
        "bullets": [],
        "content": {
          "timeline": {
            "items": [
              {
                "date": "Semaine 1-2",
                "title": "Optimisations Techniques Rapides",
                "description": "Compression des actifs, mise en cache agressive et nettoyage des scripts tiers obsolètes."
              },
              {
                "date": "Semaine 3-5",
                "title": "Refonte du Parcours UX",
                "description": "Simplification du menu, optimisation des fiches produits et tests A/B sur les boutons de conversion."
              },
              {
                "date": "Semaine 6-8",
                "title": "Déploiement Stratégie SEO",
                "description": "Réécriture des métadonnées, création de silos sémantiques et optimisation du maillage interne."
              }
            ]
          }
        },
        "timeline": {
          "items": [
            {
              "date": "Semaine 1-2",
              "title": "Optimisations Techniques Rapides",
              "description": "Compression des actifs, mise en cache agressive et nettoyage des scripts tiers obsolètes."
            },
            {
              "date": "Semaine 3-5",
              "title": "Refonte du Parcours UX",
              "description": "Simplification du menu, optimisation des fiches produits et tests A/B sur les boutons de conversion."
            },
            {
              "date": "Semaine 6-8",
              "title": "Déploiement Stratégie SEO",
              "description": "Réécriture des métadonnées, création de silos sémantiques et optimisation du maillage interne."
            }
          ]
        },
        "variation": "connected-cards",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1681583714354-5b023eee2b48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "project roadmap timeline",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@isaacmsmith",
          "name": "Isaac Smith",
          "username": "isaacmsmith"
        }
      },
      {
        "id": "slide-13",
        "type": "text-columns",
        "notes": "",
        "title": "Recommandations Stratégiques à Moyen Terme",
        "layout": "text-columns",
        "bullets": [],
        "columns": [
          {
            "text": "Nous recommandons d'évoluer vers une Progressive Web App (PWA) pour offrir une expérience quasi-instantanée sur mobile, permettant une consultation hors-ligne et des notifications push pour réengager les clients.",
            "title": "Adoption de la PWA"
          },
          {
            "text": "Mettre en place un moteur de recommandation basé sur l'IA pour afficher des produits pertinents en fonction de l'historique de navigation, augmentant ainsi le panier moyen de 10 à 15%.",
            "title": "Personnalisation Dynamique"
          },
          {
            "text": "Préparer la structure technique pour le multi-langue et le multi-devise (Hreflang), afin de capter de nouvelles parts de marché sur les zones géographiques limitrophes identifiées dans vos analytics.",
            "title": "Expansion Internationale"
          }
        ],
        "content": {
          "columns": [
            {
              "text": "Nous recommandons d'évoluer vers une Progressive Web App (PWA) pour offrir une expérience quasi-instantanée sur mobile, permettant une consultation hors-ligne et des notifications push pour réengager les clients.",
              "title": "Adoption de la PWA"
            },
            {
              "text": "Mettre en place un moteur de recommandation basé sur l'IA pour afficher des produits pertinents en fonction de l'historique de navigation, augmentant ainsi le panier moyen de 10 à 15%.",
              "title": "Personnalisation Dynamique"
            },
            {
              "text": "Préparer la structure technique pour le multi-langue et le multi-devise (Hreflang), afin de capter de nouvelles parts de marché sur les zones géographiques limitrophes identifiées dans vos analytics.",
              "title": "Expansion Internationale"
            }
          ]
        },
        "variation": "side-highlight",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1703305776591-ee46a0c72c1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "business strategy growth",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@yokonoito0512",
          "name": "Hongwei FAN",
          "username": "yokonoito0512"
        }
      },
      {
        "id": "slide-14",
        "type": "stats",
        "notes": "",
        "stats": [
          {
            "label": "Réduction attendue du temps de chargement total après application des correctifs techniques.",
            "value": "-50%"
          },
          {
            "label": "Augmentation prévisionnelle du taux de conversion organique suite à la refonte UX.",
            "value": "+22%"
          },
          {
            "label": "Multiplication par deux de la visibilité sur les mots-clés de longue traîne d'ici 6 mois.",
            "value": "x2"
          }
        ],
        "title": "Projections de Gains de Performance",
        "layout": "stats",
        "bullets": [],
        "content": {
          "stats": [
            {
              "label": "Réduction attendue du temps de chargement total après application des correctifs techniques.",
              "value": "-50%"
            },
            {
              "label": "Augmentation prévisionnelle du taux de conversion organique suite à la refonte UX.",
              "value": "+22%"
            },
            {
              "label": "Multiplication par deux de la visibilité sur les mots-clés de longue traîne d'ici 6 mois.",
              "value": "x2"
            }
          ]
        },
        "variation": "big-hero-stat",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1572984166767-b72f0b104c15?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTE5MDd8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "success financial growth",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@st_lehner",
          "name": "Stefan Lehner",
          "username": "st_lehner"
        }
      },
      {
        "id": "slide-15-1769512116168",
        "text": "L'audit de performance de Client XYZ souligne une opportunité majeure de croissance. En alignant l'infrastructure technique avec les objectifs business, nous ne nous contentons pas d'accélérer un site : nous optimisons l'ensemble du parcours client pour maximiser vos revenus et la fidélisation de vos utilisateurs.",
        "type": "image-focus",
        "notes": "",
        "title": "Conclusion : Vers une Excellence Digitale Durable",
        "layout": "image-focus",
        "bullets": [],
        "content": {
          "text": "L'audit de performance de Client XYZ souligne une opportunité majeure de croissance. En alignant l'infrastructure technique avec les objectifs business, nous ne nous contentons pas d'accélérer un site : nous optimisons l'ensemble du parcours client pour maximiser vos revenus et la fidélisation de vos utilisateurs.",
          "subtitle": "Transformer la performance technique en avantage compétitif"
        },
        "subtitle": "Transformer la performance technique en avantage compétitif",
        "variation": "default",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1669399213378-2853e748f217?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTIxMTZ8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "professional business success vision horizon",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@nickbrunner",
          "name": "Nick Brunner",
          "username": "nickbrunner"
        }
      }
    ]
  },
  {
    "title": "Révolutionner la Performance Commerciale avec Nexus CRM",
    "prompt": "Créer une présentation commerciale pour Nexus CRM mettant en avant l'augmentation de la performance des ventes.",
    "theme": "startup-pitch",
    "colorPalette": {
      "bg": "#FFFFFF",
      "text": "#0F172A",
      "accent": "#10B981",
      "primary": "#2563EB",
      "secondary": "#7C3AED"
    },
    "slides": [
      {
        "id": "slide-0",
        "type": "cover",
        "notes": "",
        "title": "Nexus CRM : L'Intelligence Artificielle au Service de votre Croissance",
        "layout": "cover",
        "bullets": [],
        "content": {
          "subtitle": "La plateforme SaaS nouvelle génération conçue pour automatiser vos ventes, centraliser vos données clients et maximiser votre ROI dès le premier trimestre."
        },
        "subtitle": "La plateforme SaaS nouvelle génération conçue pour automatiser vos ventes, centraliser vos données clients et maximiser votre ROI dès le premier trimestre.",
        "variation": "centered-minimal",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1695556655761-c4bd612306cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "modern business skyscraper high tech office",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@artististanbul",
          "name": "Adil Edin",
          "username": "artististanbul"
        }
      },
      {
        "id": "slide-1",
        "type": "bullets",
        "notes": "",
        "title": "Le constat : Pourquoi les CRM traditionnels échouent",
        "layout": "bullets",
        "bullets": [
          "La fragmentation des données entre les différents départements entraîne une perte de visibilité critique sur le parcours client, causant une baisse de 15% de la satisfaction globale.",
          "Les équipes commerciales passent en moyenne 60% de leur temps sur des tâches administratives manuelles au lieu de se concentrer sur la conclusion de contrats stratégiques.",
          "L'absence d'analyses prédictives empêche les décideurs d'anticiper les tendances du marché, rendant les prévisions de revenus incertaines et souvent erronées.",
          "Une interface utilisateur complexe et obsolète réduit drastiquement le taux d'adoption par les collaborateurs, transformant l'outil en un simple coût fixe sans valeur ajoutée."
        ],
        "content": {
          "bullets": [
            "La fragmentation des données entre les différents départements entraîne une perte de visibilité critique sur le parcours client, causant une baisse de 15% de la satisfaction globale.",
            "Les équipes commerciales passent en moyenne 60% de leur temps sur des tâches administratives manuelles au lieu de se concentrer sur la conclusion de contrats stratégiques.",
            "L'absence d'analyses prédictives empêche les décideurs d'anticiper les tendances du marché, rendant les prévisions de revenus incertaines et souvent erronées.",
            "Une interface utilisateur complexe et obsolète réduit drastiquement le taux d'adoption par les collaborateurs, transformant l'outil en un simple coût fixe sans valeur ajoutée."
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1579389082714-c16c57fa7de2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "frustrated businessman looking at computer",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@priscilladupreez",
          "name": "Priscilla Du Preez 🇨🇦",
          "username": "priscilladupreez"
        }
      },
      {
        "id": "slide-2",
        "type": "stats",
        "notes": "",
        "stats": [
          {
            "label": "Baisse de productivité moyenne due à la saisie manuelle de données redondantes.",
            "value": "-23%"
          },
          {
            "label": "Des leads qualifiés qui ne sont jamais suivis correctement par manque de rappels automatiques.",
            "value": "70%"
          },
          {
            "label": "Perte de revenus annuelle moyenne pour les PME due à une mauvaise gestion du pipeline.",
            "value": "$2.5M"
          }
        ],
        "title": "L'impact chiffré de l'inefficacité actuelle",
        "layout": "stats",
        "bullets": [],
        "content": {
          "stats": [
            {
              "label": "Baisse de productivité moyenne due à la saisie manuelle de données redondantes.",
              "value": "-23%"
            },
            {
              "label": "Des leads qualifiés qui ne sont jamais suivis correctement par manque de rappels automatiques.",
              "value": "70%"
            },
            {
              "label": "Perte de revenus annuelle moyenne pour les PME due à une mauvaise gestion du pipeline.",
              "value": "$2.5M"
            }
          ]
        },
        "variation": "data-progress",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1652180785831-911ebe69b68d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "financial data loss visualization",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@veliyunusunal",
          "name": "Veli Yunus Ünal",
          "username": "veliyunusunal"
        }
      },
      {
        "id": "slide-3",
        "text": "Nexus CRM n'est pas qu'un simple carnet d'adresses numérique. C'est un moteur de croissance qui utilise le machine learning pour prioriser vos opportunités les plus prometteuses et automatiser chaque étape de votre cycle de vente, de la prospection à la fidélisation.",
        "type": "image-focus",
        "notes": "",
        "title": "La Solution : Une Plateforme Unifiée et Intelligente",
        "layout": "image-focus",
        "bullets": [],
        "content": {
          "text": "Nexus CRM n'est pas qu'un simple carnet d'adresses numérique. C'est un moteur de croissance qui utilise le machine learning pour prioriser vos opportunités les plus prometteuses et automatiser chaque étape de votre cycle de vente, de la prospection à la fidélisation."
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1618239508321-3f6950699431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "futuristic digital interface dashboard",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@embedsocial",
          "name": "EmbedSocial",
          "username": "embedsocial"
        }
      },
      {
        "id": "slide-4",
        "type": "bento",
        "items": [
          {
            "title": "Lead Scoring Prédictif",
            "description": "Utilisez nos algorithmes d'IA pour identifier instantanément les prospects ayant la plus forte probabilité de conversion, permettant à vos commerciaux de concentrer leurs efforts là où le ROI est maximal."
          },
          {
            "title": "Workflows Automatisés",
            "description": "Éliminez les tâches répétitives grâce à des séquences d'emails, de rappels et de mises à jour de statut entièrement automatisées basées sur le comportement en temps réel de vos clients."
          },
          {
            "title": "Reporting en Temps Réel",
            "description": "Accédez à des tableaux de bord dynamiques et personnalisables qui offrent une vision à 360 degrés de votre performance commerciale, permettant des ajustements stratégiques immédiats."
          }
        ],
        "notes": "",
        "title": "Fonctionnalités Clés de Nexus CRM",
        "layout": "bento",
        "bullets": [],
        "content": {
          "items": [
            {
              "title": "Lead Scoring Prédictif",
              "description": "Utilisez nos algorithmes d'IA pour identifier instantanément les prospects ayant la plus forte probabilité de conversion, permettant à vos commerciaux de concentrer leurs efforts là où le ROI est maximal."
            },
            {
              "title": "Workflows Automatisés",
              "description": "Éliminez les tâches répétitives grâce à des séquences d'emails, de rappels et de mises à jour de statut entièrement automatisées basées sur le comportement en temps réel de vos clients."
            },
            {
              "title": "Reporting en Temps Réel",
              "description": "Accédez à des tableaux de bord dynamiques et personnalisables qui offrent une vision à 360 degrés de votre performance commerciale, permettant des ajustements stratégiques immédiats."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1704089272382-201cf5c1bbbb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "software features icon grid",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@abid_ahmad_shah",
          "name": "Abid Shah",
          "username": "abid_ahmad_shah"
        }
      },
      {
        "id": "slide-5",
        "type": "infographic",
        "notes": "",
        "title": "Optimisation du Cycle de Vente",
        "layout": "infographic",
        "bullets": [],
        "content": {
          "infographic": {
            "type": "funnel",
            "steps": [
              {
                "label": "Capture Multi-canal",
                "value": "Automatisation"
              },
              {
                "label": "Qualification IA",
                "value": "Priorisation"
              },
              {
                "label": "Engagement Ciblé",
                "value": "Personnalisation"
              },
              {
                "label": "Closing Accéléré",
                "value": "Conversion"
              }
            ]
          }
        },
        "variation": "hub-spoke",
        "infographic": {
          "type": "funnel",
          "steps": [
            {
              "label": "Capture Multi-canal",
              "value": "Automatisation"
            },
            {
              "label": "Qualification IA",
              "value": "Priorisation"
            },
            {
              "label": "Engagement Ciblé",
              "value": "Personnalisation"
            },
            {
              "label": "Closing Accéléré",
              "value": "Conversion"
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1681366099753-f904192f17bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "sales funnel process diagram",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@suryadhityas",
          "name": "Suryadhityas",
          "username": "suryadhityas"
        }
      },
      {
        "id": "slide-6",
        "type": "comparison",
        "notes": "",
        "title": "Nexus CRM vs Solutions Traditionnelles",
        "layout": "comparison",
        "bullets": [],
        "content": {
          "comparison": {
            "left": {
              "items": [
                "Mise en œuvre longue (6-12 mois)",
                "Interface complexe et peu intuitive",
                "Saisie de données manuelle fastidieuse",
                "Coûts de maintenance élevés"
              ],
              "title": "CRM Legacy"
            },
            "right": {
              "items": [
                "Déploiement en moins de 30 jours",
                "Expérience utilisateur moderne et fluide",
                "Automatisation native des données",
                "Modèle SaaS évolutif et transparent"
              ],
              "title": "Nexus CRM"
            }
          }
        },
        "comparison": {
          "left": {
            "items": [
              "Mise en œuvre longue (6-12 mois)",
              "Interface complexe et peu intuitive",
              "Saisie de données manuelle fastidieuse",
              "Coûts de maintenance élevés"
            ],
            "title": "CRM Legacy"
          },
          "right": {
            "items": [
              "Déploiement en moins de 30 jours",
              "Expérience utilisateur moderne et fluide",
              "Automatisation native des données",
              "Modèle SaaS évolutif et transparent"
            ],
            "title": "Nexus CRM"
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1707386320395-6a163624aab6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "modern vs old technology comparison",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@dfy_seoul",
          "name": "DFY® 디에프와이",
          "username": "dfy_seoul"
        }
      },
      {
        "id": "slide-7",
        "type": "chart",
        "chart": {
          "type": "bar",
          "title": "Croissance attendue du chiffre d'affaires après intégration de Nexus CRM",
          "series": [
            {
              "data": [
                5,
                12,
                22,
                35
              ],
              "name": "Augmentation du CA (%)"
            }
          ],
          "categories": [
            "Q1",
            "Q2",
            "Q3",
            "Q4"
          ]
        },
        "notes": "",
        "title": "Projection du ROI sur 12 mois",
        "layout": "chart",
        "bullets": [],
        "content": {
          "chart": {
            "type": "bar",
            "title": "Croissance attendue du chiffre d'affaires après intégration de Nexus CRM",
            "series": [
              {
                "data": [
                  5,
                  12,
                  22,
                  35
                ],
                "name": "Augmentation du CA (%)"
              }
            ],
            "categories": [
              "Q1",
              "Q2",
              "Q3",
              "Q4"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1576073459656-9b03ee75cc92?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "business growth success chart",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@slidebean",
          "name": "Slidebean",
          "username": "slidebean"
        }
      },
      {
        "id": "slide-8",
        "type": "timeline",
        "notes": "",
        "title": "Plan de Déploiement Accéléré",
        "layout": "timeline",
        "bullets": [],
        "content": {
          "timeline": {
            "items": [
              {
                "date": "Semaine 1",
                "title": "Audit et Configuration",
                "description": "Analyse de vos processus actuels et personnalisation de l'architecture Nexus CRM pour correspondre à vos besoins spécifiques."
              },
              {
                "date": "Semaine 2",
                "title": "Migration des Données",
                "description": "Transfert sécurisé de vos bases de données existantes vers notre infrastructure cloud haute performance."
              },
              {
                "date": "Semaine 3",
                "title": "Formation des Équipes",
                "description": "Sessions de formation interactives pour garantir une adoption rapide et efficace par l'ensemble des utilisateurs."
              },
              {
                "date": "Semaine 4",
                "title": "Lancement et Optimisation",
                "description": "Mise en service complète avec un accompagnement dédié pour ajuster les premiers workflows en conditions réelles."
              }
            ]
          }
        },
        "timeline": {
          "items": [
            {
              "date": "Semaine 1",
              "title": "Audit et Configuration",
              "description": "Analyse de vos processus actuels et personnalisation de l'architecture Nexus CRM pour correspondre à vos besoins spécifiques."
            },
            {
              "date": "Semaine 2",
              "title": "Migration des Données",
              "description": "Transfert sécurisé de vos bases de données existantes vers notre infrastructure cloud haute performance."
            },
            {
              "date": "Semaine 3",
              "title": "Formation des Équipes",
              "description": "Sessions de formation interactives pour garantir une adoption rapide et efficace par l'ensemble des utilisateurs."
            },
            {
              "date": "Semaine 4",
              "title": "Lancement et Optimisation",
              "description": "Mise en service complète avec un accompagnement dédié pour ajuster les premiers workflows en conditions réelles."
            }
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1759884247146-b6cba3d92341?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "project management timeline roadmap",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@sigmund",
          "name": "Sigmund",
          "username": "sigmund"
        }
      },
      {
        "id": "slide-9-1769512628880",
        "items": [
          {
            "title": "TechFlow Solutions",
            "description": "Réduction de 25% du cycle de vente grâce à l'automatisation intelligente des workflows et une qualification de leads ultra-précise."
          },
          {
            "title": "Innovate Inc.",
            "description": "Gain de productivité de 40% pour les équipes commerciales dès le premier trimestre d'utilisation de notre interface intuitive."
          },
          {
            "title": "Global Retail",
            "description": "Une vision client à 360° qui a permis de doubler le taux de rétention sur le segment premium grâce au scoring prédictif."
          },
          {
            "title": "DataSphere",
            "description": "Suppression totale des silos entre marketing et ventes, créant une synergie parfaite et une augmentation des revenus de 15%."
          }
        ],
        "title": "Ils Propulsent leur Croissance avec Nexus CRM",
        "layout": "bento",
        "bullets": [],
        "content": {
          "items": [
            {
              "title": "TechFlow Solutions",
              "description": "Réduction de 25% du cycle de vente grâce à l'automatisation intelligente des workflows et une qualification de leads ultra-précise."
            },
            {
              "title": "Innovate Inc.",
              "description": "Gain de productivité de 40% pour les équipes commerciales dès le premier trimestre d'utilisation de notre interface intuitive."
            },
            {
              "title": "Global Retail",
              "description": "Une vision client à 360° qui a permis de doubler le taux de rétention sur le segment premium grâce au scoring prédictif."
            },
            {
              "title": "DataSphere",
              "description": "Suppression totale des silos entre marketing et ventes, créant une synergie parfaite et une augmentation des revenus de 15%."
            }
          ]
        },
        "variation": "feature-focus",
        "backgroundImage": "https://images.unsplash.com/photo-1758691736764-2a88e313b1f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI2Mjh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "business partnership success growth",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@silverkblack",
          "name": "Vitaly Gariev",
          "username": "silverkblack"
        }
      },
      {
        "id": "slide-10",
        "type": "table",
        "notes": "",
        "table": {
          "rows": [
            [
              "Utilisateurs",
              "Jusqu'à 5",
              "Jusqu'à 50",
              "Illimité"
            ],
            [
              "IA Lead Scoring",
              "Basique",
              "Avancé",
              "Prédictif complet"
            ],
            [
              "Support",
              "Email",
              "Prioritaire 24/7",
              "Account Manager dédié"
            ],
            [
              "Prix / mois",
              "49€",
              "149€",
              "Sur mesure"
            ]
          ],
          "columns": [
            "Fonctionnalités",
            "Plan Starter",
            "Plan Business",
            "Plan Enterprise"
          ]
        },
        "title": "Une Offre Adaptée à votre Échelle",
        "layout": "table",
        "bullets": [],
        "content": {
          "table": {
            "rows": [
              [
                "Utilisateurs",
                "Jusqu'à 5",
                "Jusqu'à 50",
                "Illimité"
              ],
              [
                "IA Lead Scoring",
                "Basique",
                "Avancé",
                "Prédictif complet"
              ],
              [
                "Support",
                "Email",
                "Prioritaire 24/7",
                "Account Manager dédié"
              ],
              [
                "Prix / mois",
                "49€",
                "149€",
                "Sur mesure"
              ]
            ],
            "columns": [
              "Fonctionnalités",
              "Plan Starter",
              "Plan Business",
              "Plan Enterprise"
            ]
          }
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://placehold.co/1920x1080/1a1a2e/ffffff?text=business%20pricing%20opt",
        "imageSearchQuery": "business pricing options"
      },
      {
        "id": "slide-11",
        "type": "text-columns",
        "notes": "",
        "title": "Pourquoi Choisir Nexus CRM ?",
        "layout": "text-columns",
        "bullets": [],
        "columns": [
          {
            "text": "Vos données sont protégées par un chiffrement de bout en bout et hébergées sur des serveurs certifiés ISO 27001, garantissant une confidentialité totale et une conformité RGPD stricte pour tous vos actifs clients.",
            "title": "Sécurité de Grade Bancaire"
          },
          {
            "text": "Nexus CRM s'intègre nativement avec plus de 500 applications professionnelles, incluant Slack, Microsoft 365, Google Workspace et vos outils de marketing automation favoris pour une synchronisation sans effort.",
            "title": "Écosystème Ouvert"
          },
          {
            "text": "En tant que solution SaaS, vous bénéficiez de mises à jour mensuelles automatiques intégrant les dernières avancées en intelligence artificielle sans aucun coût supplémentaire ni interruption de service.",
            "title": "Innovation Continue"
          }
        ],
        "content": {
          "columns": [
            {
              "text": "Vos données sont protégées par un chiffrement de bout en bout et hébergées sur des serveurs certifiés ISO 27001, garantissant une confidentialité totale et une conformité RGPD stricte pour tous vos actifs clients.",
              "title": "Sécurité de Grade Bancaire"
            },
            {
              "text": "Nexus CRM s'intègre nativement avec plus de 500 applications professionnelles, incluant Slack, Microsoft 365, Google Workspace et vos outils de marketing automation favoris pour une synchronisation sans effort.",
              "title": "Écosystème Ouvert"
            },
            {
              "text": "En tant que solution SaaS, vous bénéficiez de mises à jour mensuelles automatiques intégrant les dernières avancées en intelligence artificielle sans aucun coût supplémentaire ni interruption de service.",
              "title": "Innovation Continue"
            }
          ]
        },
        "variation": "modern-cards",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1758876020211-ff39dd35a3bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "security and reliability concept",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@silverkblack",
          "name": "Vitaly Gariev",
          "username": "silverkblack"
        }
      },
      {
        "id": "slide-12",
        "type": "section",
        "notes": "",
        "title": "Prêt à transformer votre pipeline en moteur de revenus ?",
        "layout": "section",
        "bullets": [],
        "content": {
          "subtitle": "Rejoignez plus de 500 entreprises qui ont déjà choisi Nexus CRM pour piloter leur succès commercial."
        },
        "subtitle": "Rejoignez plus de 500 entreprises qui ont déjà choisi Nexus CRM pour piloter leur succès commercial.",
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1581374820583-317d45555a82?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "business handshake agreement",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@photosbychalo",
          "name": "Chalo Garcia",
          "username": "photosbychalo"
        }
      },
      {
        "id": "slide-13",
        "type": "bullets",
        "notes": "",
        "title": "Prochaines Étapes : Votre Succès Commence Ici",
        "layout": "bullets",
        "bullets": [
          "Réservez votre démonstration personnalisée dès aujourd'hui pour découvrir comment Nexus CRM peut s'adapter spécifiquement à vos défis commerciaux uniques.",
          "Profitez d'un audit gratuit de votre stack technologique actuelle réalisé par l'un de nos consultants experts en transformation digitale.",
          "Activez votre période d'essai de 14 jours sans engagement pour tester la puissance de nos outils d'automatisation en conditions réelles avec vos propres données.",
          "Contactez notre équipe commerciale pour obtenir une proposition tarifaire sur mesure alignée avec vos objectifs de croissance pour l'année à venir."
        ],
        "content": {
          "bullets": [
            "Réservez votre démonstration personnalisée dès aujourd'hui pour découvrir comment Nexus CRM peut s'adapter spécifiquement à vos défis commerciaux uniques.",
            "Profitez d'un audit gratuit de votre stack technologique actuelle réalisé par l'un de nos consultants experts en transformation digitale.",
            "Activez votre période d'essai de 14 jours sans engagement pour tester la puissance de nos outils d'automatisation en conditions réelles avec vos propres données.",
            "Contactez notre équipe commerciale pour obtenir une proposition tarifaire sur mesure alignée avec vos objectifs de croissance pour l'année à venir."
          ]
        },
        "illustration": {
          "url": "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
          "type": "icon",
          "iconName": "Sparkles"
        },
        "backgroundImage": "https://images.unsplash.com/photo-1684217875364-35ed8311d463?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4Mzc3NTl8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk1MTI0OTh8&ixlib=rb-4.1.0&q=80&w=1080",
        "imageSearchQuery": "modern office meeting collaboration",
        "unsplashPhotographer": {
          "link": "https://unsplash.com/@hello_itspooja",
          "name": "Pooja Singh",
          "username": "hello_itspooja"
        }
      }
    ]
  }
];
