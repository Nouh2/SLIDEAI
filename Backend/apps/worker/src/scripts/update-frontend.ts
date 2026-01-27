
import * as fs from 'fs';
import * as path from 'path';

// Assuming we run this from Backend/apps/worker
const jsonPath = path.join(process.cwd(), 'fetched_examples.json');

const manualPrompts: Record<string, string> = {
    "Ethos Brew: Premium Organic Coffee Launch Strategy": "Develop a comprehensive go-to-market strategy for the launch of Ethos Brew, a premium organic coffee brand.",
    "Audit de Performance Web : Client XYZ": "Réaliser un audit technique et SEO complet du site web de Client XYZ avec recommandations stratégiques.",
    "Révolutionner la Performance Commerciale avec Nexus CRM": "Créer une présentation commerciale pour Nexus CRM mettant en avant l'augmentation de la performance des ventes."
};

try {
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const examples = JSON.parse(rawData);

    examples.forEach((ex: any) => {
        if (manualPrompts[ex.title]) {
            ex.prompt = manualPrompts[ex.title];
        }
        // Ensure colorPalette is present, if not, use theme defaults or placeholder
        if (!ex.colorPalette) {
            // Fallback if needed, but the extract script should have grabbed it
        }
    });

    const tsContent = `export interface Example {
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

export const examples: Example[] = ${JSON.stringify(examples, null, 2)};
`;

    // Target: SLIDEAI/Frontend/presto-decks/src/data/examples.ts
    // From SLIDEAI/Backend/apps/worker
    const destPath = path.resolve(process.cwd(), '../../../Frontend/presto-decks/src/data/examples.ts');

    fs.writeFileSync(destPath, tsContent);
    console.log(`Successfully updated ${destPath}`);

} catch (error) {
    console.error("Error updating examples:", error);
}
