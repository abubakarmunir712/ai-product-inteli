# Lowel — product network prototype

Front-end-only clickable prototype. There's no backend: all data is mocked in `src/data/seed.ts` and saved in the browser (localStorage). The AI assistant is simulated in `src/lib/assistant.ts`. It builds answers from the real product data (specs, AI scores, ratings, prices, manuals), so it works for any products, including ones uploaded during the demo.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static build in dist/ (deploy to any static host)
```

## Demo script
1. **Sign in as a User** (e.g. Sara Malik). The LinkedIn-style feed shows manufacturer launches and user reviews. Like, comment, follow.
2. **Explore** → filter by category, sort by "Best value" → click **Compare** on two products → **Compare with AI** in the bottom tray.
3. **AI Assistant**: watch it "read" the specs, manuals and ratings, then stream a comparison with a side-by-side table, value scores and sources. Try the follow-up chips ("Which has better camera?", "Compare their warranties", "Add … to the comparison").
4. **Product page**: specs, manual previews, rating breakdown → **Rate this product**.
5. **Me → Switch account → Manufacturer** (e.g. Orbit Mobile) → **Dashboard** → **Upload product**: fill in specs, drop in PDF manuals ("Indexing for AI…"), publish. It shows up in the feed and can be compared in the assistant right away.
6. **Me → Reset demo data** restores the original state.

## Where things live
- `src/data/seed.ts`: manufacturers, products, reviews, posts. `APP_NAME` is the brand name.
- `src/lib/assistant.ts`: `respond()` is the single function to swap for the real AI/RAG API.
- `src/lib/utils.ts`: rating stats, quality and value-for-money scoring.
- `src/store.ts`: app state (zustand, persisted).
# ai-product-inteli
