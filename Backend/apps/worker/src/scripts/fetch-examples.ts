
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const titles = [
    "Audit de Performance Web : Client XYZ",
    "Ethos Brew: Premium Organic Coffee Launch Strategy",
    "Révolutionner la Performance Commerciale avec Nexus CRM"
];

async function fetchExamples() {
    console.log('Fetching examples...');

    const { data, error } = await supabase
        .from('presentations')
        .select('*')
        .in('title', titles);

    if (error) {
        console.error('Error fetching presentations:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('No presentations found with these titles.');
        return;
    }

    console.log(`Found ${data.length} presentations.`);

    const formattedExamples = data.map((p: any) => {
        // The 'slides' column in DB seems to be the full Deck object based on worker.ts
        // Deck object has: title, theme, slides[], colorPalette?
        const deck = p.slides;

        // We need to map this to the Example interface in frontend
        /*
        export interface Example {
          title: string;
          prompt: string; // We might not have the original prompt stored in the deck object, checking worker.ts 'sanitizeDeck' adds prompt to deck? 
          // In worker.ts: deck = sanitizeDeck(deck, prompt); 
          // let's check if prompt is in deck object.
          theme: string;
          thumbnail?: string;
          colorPalette?: ...
          slides: any[];
        }
        */

        // If prompt is missing, we'll placeholder it or try to find it.
        // The DB schema usually has title, slides (jsonb).

        return {
            title: deck.title || p.title,
            prompt: deck.prompt || "Generated presentation",
            theme: deck.theme,
            colorPalette: deck.colorPalette,
            slides: deck.slides
        };
    });

    const outputPath = path.join(process.cwd(), 'fetched_examples.json');
    fs.writeFileSync(outputPath, JSON.stringify(formattedExamples, null, 2));
    console.log(`Saved to ${outputPath}`);
}

fetchExamples();
