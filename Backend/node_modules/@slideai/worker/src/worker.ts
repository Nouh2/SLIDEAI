// apps/worker/src/worker.ts
import { Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { ulid } from 'ulid';
import AWS from 'aws-sdk';
import OpenAI from 'openai';

// Redis (Upstash ou local)
const connection = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Redis client direct pour status
const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// R2 config (S3-compatible via AWS SDK v2)
const hasR2 =
  !!process.env.R2_ACCOUNT_ID &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET;

const r2 = hasR2
  ? new AWS.S3({
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      signatureVersion: 'v4',
      s3ForcePathStyle: true,
    })
  : null;

const bucket = process.env.R2_BUCKET ?? 'slideai-exports';

const setJob = async (traceId: string, value: any, ttlSec = 3600) => {
  await redis.set(`job:${traceId}`, JSON.stringify(value), 'EX', ttlSec);
};

// ---------- IA (OpenAI) ----------

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// Prompt système pour structurer le JSON renvoyé
const DECK_SYSTEM_PROMPT = `
Tu es SlideAI, un assistant expert en création de présentations modernes.

Tu dois renvoyer EXCLUSIVEMENT un JSON strict, sans texte autour.
Ce JSON doit respecter exactement le schéma suivant :

{
  "title": "string",
  "theme": "Modern-01" | "Minimal-Grid" | "Bold-Contrast",
  "prompt": "string",
  "slides": [
    {
      "title": "string",
      "bullets": ["string"],
      "layout": "title-left-bullets-right-illustration" |
                "title-top-bullets-bottom" |
                "title-top-columns" |
                "title-left-metrics-right",
      "illustration": {
        "type": "icon" | "image",
        "name": "string",
        "url": "string"
      }
    }
  ]
}

Règles :
- 6 à 10 slides maximum
- Titres courts, clairs, orientés message
- Bullets concises (5–12 mots), actionnables, sans blabla
- Utilise plusieurs layouts différents dans le deck
- "theme" doit être l’une des valeurs : "Modern-01", "Minimal-Grid", "Bold-Contrast"
- Le JSON doit être valide, sans commentaires ni texte supplémentaire.
`;

// ----------------- Worker "generate" (IA réelle) -----------------

const generateWorker = new Worker(
  'generate',
  async (job) => {
    const { traceId, data } = job.data as any;
    const { prompt, language, tone, length } = data ?? {};

    await setJob(traceId, {
      status: 'processing',
      type: 'generate',
      startedAt: Date.now(),
    });

    console.log(
      JSON.stringify({
        traceId,
        event: 'generate.start',
        prompt,
        language,
        tone,
        length,
      }),
    );

    try {
      const userPrompt = `
Sujet : ${prompt}
Langue : ${language ?? 'fr'}
Ton : ${tone ?? 'pro'}
Longueur : ${length ?? 'medium'}

Contexte : Génère un deck de présentation structuré pour un outil de génération de slides.
Chaque slide doit être pertinente par rapport au sujet et à l'objectif implicite du prompt.
`;

      const response = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: DECK_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      });

      const raw = response.choices[0]?.message?.content;

      if (!raw) {
        throw new Error('Réponse OpenAI vide');
      }

      console.log('[worker.generate] Réponse IA brute (début) :', raw.slice(0, 200), '...');

      let deck: any;
      try {
        deck = JSON.parse(raw);
      } catch (e) {
        console.error('[worker.generate] JSON.parse a échoué :', e);
        throw new Error('JSON IA invalide (parse)');
      }

      // Petit garde-fou minimum (on pourrait utiliser Zod plus tard)
      if (!deck.title || !Array.isArray(deck.slides)) {
        console.error('[worker.generate] Deck IA incomplet, structure reçue :', deck);
        throw new Error('Deck IA incomplet ou mal formé');
      }

      console.log(
        JSON.stringify({
          traceId,
          event: 'generate.done',
          slides: deck.slides.length,
          title: deck.title,
        }),
      );

      await setJob(traceId, {
        status: 'succeeded',
        type: 'generate',
        deck,
        finishedAt: Date.now(),
      });

      return { traceId, deck };
    } catch (err: any) {
      console.error('[worker.generate] Erreur IA, fallback mock :', err);

      const fallbackDeck = {
        title: `Deck (fallback) - ${prompt?.slice(0, 30) ?? 'SlideAI'}`,
        theme: 'Modern-01',
        prompt: prompt ?? '',
        slides: [
          {
            title: 'Erreur de génération',
            bullets: [
              "Une erreur est survenue lors de l'appel à l’IA.",
              'Veuillez réessayer dans quelques instants.',
            ],
            layout: 'title-top-bullets-bottom',
            illustration: { type: 'icon', name: 'AlertTriangle', url: '' },
          },
        ],
      };

      await setJob(traceId, {
        status: 'succeeded',
        type: 'generate',
        deck: fallbackDeck,
        finishedAt: Date.now(),
        error: err?.message ?? String(err),
      });

      return { traceId, deck: fallbackDeck };
    }
  },
  { connection },
);

// ----------------- Worker "export" (mock + R2) -----------------

const exportWorker = new Worker(
  'export',
  async (job) => {
    const { traceId, data } = job.data as any;
    await setJob(traceId, { status: 'processing', type: 'export', startedAt: Date.now() });

    // Si R2 est configuré → export vers R2 + URL signée
    if (hasR2 && r2) {
      const key = `exports/${data.projectId}/${ulid()}-${data.format}.txt`;
      const body = Buffer.from(
        `Mock export ${data.format} for project ${data.projectId} (traceId=${traceId}) at ${new Date().toISOString()}`,
        'utf-8',
      );
      await r2
        .putObject({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: 'text/plain',
        })
        .promise();

      const url = r2.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: key,
        Expires: 60 * 10, // 10 minutes
      });

      console.log(JSON.stringify({ traceId, event: 'export.done', url }));
      await setJob(traceId, { status: 'succeeded', type: 'export', url, finishedAt: Date.now() });
      return { traceId, url };
    }

    // Sinon → mode safe (dev) : renvoyer le contenu mock dans le statut
    const mock = {
      filename: `export-${data.projectId}-${data.format}.txt`,
      mime: 'text/plain',
      bytes: Buffer.from(
        `Mock export ${data.format} (no R2 configured) for project ${data.projectId} at ${new Date().toISOString()}`,
        'utf-8',
      ).byteLength,
      note: 'R2 non configuré : résultat retourné inline',
    };

    console.log(JSON.stringify({ traceId, event: 'export.done', inline: true }));
    await setJob(traceId, {
      status: 'succeeded',
      type: 'export',
      inline: true,
      meta: mock,
      finishedAt: Date.now(),
    });
    return { traceId, inline: true, meta: mock };
  },
  { connection },
);

// Events (logging simple)
new QueueEvents('generate', { connection }).on('completed', ({ jobId }) =>
  console.log(JSON.stringify({ jobId, queue: 'generate', status: 'completed' })),
);
new QueueEvents('export', { connection }).on('completed', ({ jobId }) =>
  console.log(JSON.stringify({ jobId, queue: 'export', status: 'completed' })),
);

console.log('Worker started');
