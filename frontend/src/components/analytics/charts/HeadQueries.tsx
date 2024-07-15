import { createEffect, createSignal, For, Show } from "solid-js";
import { PaginationButtons } from "../PaginationButtons";
import { AnalyticsFilter, HeadQuery } from "../../../types";
import { usePagination } from "../usePagination";
import { getHeadQueries } from "../api/analytics";

interface HeadQueriesProps {
  params: { filter: AnalyticsFilter };
}

export const HeadQueries = (props: HeadQueriesProps) => {
  const pages = usePagination();
  const [results, setResults] = createSignal<HeadQuery[]>([]);

  createEffect(async () => {
    const params = props.params;
    const curPage = pages.page();

    const results = await getHeadQueries(params.filter, curPage + 1);
    if (results.length === 0) {
      pages.setMaxPageDiscovered(curPage);
    }
    setResults(results);
  });

  return (
    <>
      <Show when={results().length === 0}>
        <div class="py-4 text-center">
          <div class="text-lg">No queries found</div>
          <div class="text-sm text-neutral-600">
            There are no queries to display.
          </div>
        </div>
      </Show>
      <Show fallback={<div class="py-8">Loading...</div>} when={results()}>
        {(data) => (
          <table class="mt-2 w-full py-2">
            <thead>
              <Show when={data().length > 0}>
                <tr>
                  <th class="text-left font-semibold">Query</th>
                  <th class="text-right font-semibold">Count</th>
                </tr>
              </Show>
            </thead>
            <tbody>
              <For each={data()}>
                {(query) => {
                  return <QueryCard query={query} />;
                }}
              </For>
            </tbody>
          </table>
        )}
      </Show>
      <div class="flex justify-end pt-2">
        <PaginationButtons size={18} pages={pages} />
      </div>
    </>
  );
};

interface QueryCardProps {
  query: HeadQuery;
}
const QueryCard = (props: QueryCardProps) => {
  return (
    <tr>
      <td class="truncate">{props.query.query}</td>
      <td class="text-right">{props.query.count}</td>
    </tr>
  );
};
