# Worker Modifications - Apply Manually

## 1. Fix Unsplash API (ligne ~74-101)

Remplacer la fonction `getUnsplashImage` try block par:

```typescript
  try {
    const fullQuery = `${query} ${styleKeywords}`;
    // FIX FINAL: Utiliser /photos/random avec Accept-Version header requis
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(fullQuery)}&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Client-ID ${accessKey}`,
        'Accept-Version': 'v1'  // Header REQUIS par Unsplash API
      }
    });

    if (response.status === 403) {
      const errorBody = await response.text();
      console.warn(`[Unsplash] 403 Forbidden. Body: ${errorBody}`);
      return fallback;
    }

    if (response.status === 401) {
      console.warn('[Unsplash] 401 Unauthorized - Invalid Access Key');
      return fallback;
    }

    if (!response.ok) {
      console.warn(`[Unsplash] Error ${response.status}`);
      return fallback;
    }

    const data: any = await response.json();
    return data.urls?.regular || data.urls?.full || fallback;

  } catch (error) {
    console.error('[Unsplash] Exception:', error);
    return fallback;
  }
```

## 2. Add Debug Export Worker (ligne ~335)

Remplacer le début du `try` block dans `exportWorker` par:

```typescript
  try {
    console.log('\n=== EXPORT DEBUG START ===');
    console.log('[Export] Received deck.theme:', data.deck?.theme);
    console.log('[Export] Received deck.themeConfig:', data.deck?.themeConfig ? 'EXISTS' : 'MISSING');
    
    // ⚠️ CRITICAL FIX: Re-hydratation du thème si perdu durant le roundtrip Frontend
    if (data.deck && !data.deck.themeConfig) {
      console.warn('[Export] ⚠️ themeConfig MISSING! Re-hydrating from theme ID...');
      const themeId = data.deck.theme || 'startup-pitch';
      data.deck.themeConfig = normalizeTheme(themeId);
      console.log(`[Export] ✅ Restored themeConfig: ${data.deck.themeConfig.id} (Mode: ${data.deck.themeConfig.mode})`);
    } else if (data.deck?.themeConfig) {
      console.log(`[Export] ✅ themeConfig preserved: ${data.deck.themeConfig.id} (Mode: ${data.deck.themeConfig.mode})`);
    }
    console.log('=== EXPORT DEBUG END ===\n');

    const buffer = await generatePPTX(data.deck);
    // ... rest of export code
```

## 3. Test Script Created

Fichiers créés:
- `/Backend/scripts/debug-keys.ts` - Script de test Unsplash
- `/Backend/scripts/package.json` - Pour exécuter le script
- `/Backend/scripts/.env` - Variables d'env

### Pour exécuter le test:
```powershell
cd Backend/scripts
npm run debug:unsplash
```

## Changements Clés

### Unsplash Fix:
1. **Changement d'endpoint**: `/search/photos` → `/photos/random`
2. **Ajout du header**: `Accept-Version: 'v1'` (CRITIQUE!)
3. **Meilleure gestion d'erreur**: Affiche le corps de la réponse 403

### Export Fix:
1. **Debug complet**: Logs du deck reçu
2. **Re-hydratation**: Si `themeConfig` manque, recréation depuis `theme` ID
3. **Prévention**: Évite la perte du thème dark → blanc
