import { createEffect, createSignal, For, Show } from "solid-js";
import { SearchTypeCount, DateRangeOption, dateRanges } from "../../../types";
import { toTitleCase } from "../usePagination";
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

export const QueryCounts = () => {
  const [dateSelection, setDateSelection] = createSignal<DateRangeOption>(
    dateRanges[2]
  );

  const [headQueries, setHeadQueries] = createSignal<SearchTypeCount[]>([]);

  createEffect(async () => {
    let results = await getQueryCounts(dateSelection().date);
    setHeadQueries(results);
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
      <Show fallback={<div class="py-8">Loading...</div>} when={headQueries()}>
        {(data) => (
          <div class="flex justify-around gap-2 py-2">
            <For each={data()}>
              {(search) => {
                return (
                  <div class="text-center">
                    <div>{displaySearchType(search.search_type)}</div>
                    <Show when={search.search_method}>
                      {(method) => (
                        <div class="opacity-50">{toTitleCase(method())}</div>
                      )}
                    </Show>
                    <div class="text-lg font-semibold">
                      {search.search_count}
                    </div>
                  </div>
                );
              }}
            </For>
          </div>
        )}
      </Show>
    </div>
  );
};
