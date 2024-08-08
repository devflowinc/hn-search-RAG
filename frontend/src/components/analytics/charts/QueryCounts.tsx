import { createEffect, createSignal, For, Show } from "solid-js";
import { SearchTypeCount, AnalyticsFilter } from "../../../types";
import { getQueryCounts } from "../api/analytics";

const displaySearchType = (type: SearchTypeCount["search_type"]) => {
  switch (type) {
    case "search":
      return "Search";
    case "autocomplete":
      return "Autocomplete";
    case "search_over_groups":
      return "Search Over Groups";
    case "search_within_groups":
      return "Search Within Groups";
    case "rag":
      return "RAG";
    default:
      return type;
  }
};

export const displaySearchMethod = (type: SearchTypeCount["search_method"]) => {
  switch (type) {
    case "fulltext":
      return "Full Text";
    case "hybrid":
      return "Hybrid";
    case "semantic":
      return "Semantic";
    case "bm25":
      return "BM25";
    default:
      return null;
  }
};

interface QueryCountsProps {
  params: {
    filter: AnalyticsFilter;
  };
}

export const QueryCounts = (props: QueryCountsProps) => {
  const [queryCounts, setQueryCounts] = createSignal<SearchTypeCount[]>([]);

  createEffect(async () => {
    let results = await getQueryCounts(props.params.filter);
    setQueryCounts(results);
  });

  return (
    <div>
      <div class="flex items-baseline justify-between gap-4">
        <div>
          <div class="text-lg leading-none">Total Searches</div>
          <div class="text-sm text-neutral-600">
            Total Count of Queries by Type
          </div>
        </div>
      </div>
      <Show fallback={<div class="py-8">Loading...</div>} when={queryCounts()}>
        {(data) => (
          <div class="flex justify-around gap-2 py-2">
            <For each={data()}>
              {(search) => {
                console.log(search);
                if (search.search_method) {
                  return (
                    <div class="text-center">
                      <div>{displaySearchType(search.search_type)}</div>
                      <div class="opacity-50">
                        {displaySearchMethod(search.search_method)}
                      </div>
                      <div class="text-lg font-semibold">
                        {search.search_count}
                      </div>
                    </div>
                  );
                }
              }}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};
