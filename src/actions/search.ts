"use server";

import { getQuickSearchSuggestions, type SearchSuggestions } from "@/lib/search-suggestions";
import { getMarket } from "@/lib/market";

export async function getSearchSuggestionsForHeader(q: string): Promise<SearchSuggestions> {
  const market = await getMarket();
  return getQuickSearchSuggestions(q, market);
}
