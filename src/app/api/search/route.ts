import { NextResponse, NextRequest } from 'next/server';
import search from '@pikisoft/duckduckgo-search';

interface SearchResultSnippet {
  text: string;
  url: string;
}

export async function POST(originalRequest: NextRequest) {
  const request = originalRequest.clone();
  try {
    const { query, limit = 5 } = await request.json();

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json({ error: 'Query parameter is missing or invalid.' }, { status: 400 });
    }

    console.log(`[API /search] Received query: "${query}"`);

    const searchResultsArray: SearchResultSnippet[] = [];

    try {
      const asyncGeneratorResults = search.text(query); // search.text() returns an AsyncGenerator
      // Define the expected structure of results from @pikisoft/duckduckgo-search, using 'href'
      type PikisoftTextResult = { title: string, body: string, href?: string, icon?: string, hostname?: string }; 
      const collectedDdGResults: PikisoftTextResult[] = [];

      console.log(`[API /search] Initialized AsyncGenerator for query "${query}". Attempting to collect results...`);

      let itemsCollected = 0;
      for await (const result of asyncGeneratorResults) {
        const currentResult = result as PikisoftTextResult; // Type assertion for clarity

        // Ensure essential fields are present, using 'href'
        if (currentResult && currentResult.body && currentResult.href) { 
          if (itemsCollected === 0) { // Log only the first item that's about to be collected
            console.log(`[API /search] Structure of first valid result to be collected:`, currentResult);
          }
          collectedDdGResults.push(currentResult);
          itemsCollected++;
          if (itemsCollected >= limit) {
            break; // Stop collecting once we have enough items (respecting the limit)
          }
        }
      }

      console.log(`[API /search] Collected ${collectedDdGResults.length} results from '@pikisoft/duckduckgo-search' for query "${query}".`);
      // console.log("[API /search] Collected results content:", collectedDdGResults); // Optional: for deeper debugging

      if (collectedDdGResults.length > 0) {
        for (const item of collectedDdGResults) { 
          // Ensure item.href is present before pushing (it should be due to the check above)
          if (item.href) { 
            searchResultsArray.push({
              text: item.body,
              url: item.href // Source from item.href, assign to 'url' in SearchResultSnippet
            });
          }
        }
      }
    } catch (searchError: any) {
      console.error(`[API /search] Error using '@pikisoft/duckduckgo-search' package for query "${query}":`, searchError);
    }

    console.log(`[API /search] Extracted snippets for query "${query}":`, searchResultsArray);

    return NextResponse.json({ searchResultsArray });

  } catch (error: any) {
    console.error('[API /search] General error in POST handler:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
