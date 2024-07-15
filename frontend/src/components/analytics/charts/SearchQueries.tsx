import { createEffect, createSignal, For, Show } from "solid-js";
import { PaginationButtons } from "../PaginationButtons";
import { ChartCard } from "./ChartCard";
import { Select } from "../Select";
import { usePagination } from "../usePagination";
import {
  AnalyticsFilter,
  SortBy,
  SortOrder,
  SearchQueryEvent,
} from "../../../types";
import { getSearchQueries } from "../api/analytics";

interface SearchQueriesProps {
  params: { filter: AnalyticsFilter };
}

const ALL_SORT_BY: SortBy[] = ["created_at", "latency", "top_score"];
const ALL_SORT_ORDER: SortOrder[] = ["asc", "desc"];

export const SearchQueries = (props: SearchQueriesProps) => {
  const pages = usePagination();

  const [sortBy, setSortBy] = createSignal<SortBy>("created_at");
  const [sortOrder, setSortOrder] = createSignal<SortOrder>("desc");
  const [searchQueries, setSearchQueries] = createSignal<SearchQueryEvent[]>(
    []
  );

  createEffect(async () => {
    const curPage = pages.page();

    const results = await getSearchQueries(
      props.params.filter,
      sortBy(),
      sortOrder(),
      curPage
    );

    if (results.length === 0) {
      pages.setMaxPageDiscovered(curPage);
    }
    setSearchQueries(results);
  });

  return (
    <ChartCard
      title="Search Queries"
      subtitle={"All Search Queries"}
      class="flex flex-col px-4"
      width={2}
      controller={
        <div class="flex gap-2">
          <Select
            class="min-w-[80px] min-h-7 bg-neutral-100/90"
            options={ALL_SORT_BY.map((e) => formatSortBy(e))}
            selected={formatSortBy(sortBy())}
            onSelected={(e) =>
              setSortBy(ALL_SORT_BY.find((s) => formatSortBy(s) === e)!)
            }
          />
          <Select
            class="min-w-[80px] min-h-7 bg-neutral-100/90"
            options={ALL_SORT_ORDER.map((e) => formatSortOrder(e))}
            selected={formatSortOrder(sortOrder())}
            onSelected={(e) =>
              setSortOrder(
                ALL_SORT_ORDER.find((s) => formatSortOrder(s) === e)!
              )
            }
          />
        </div>
      }
    >
      <div>
        <Show when={searchQueries().length === 0}>
          <div class="py-8 text-center opacity-80">No Data.</div>
        </Show>
        <Show
          fallback={<div class="py-8 text-center">Loading...</div>}
          when={searchQueries()}
        >
          {(data) => (
            <Show when={data().length > 0}>
              <div class="pt-2">
                <table class="w-full">
                  <thead>
                    <tr>
                      <th class="text-left font-semibold">Message</th>
                      <th class="text-right font-semibold">Search Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={data()}>
                      {(search_query_event) => {
                        return (
                          <SearchQueryEventCard
                            search_query_event={search_query_event}
                          />
                        );
                      }}
                    </For>
                  </tbody>
                </table>
                <div class="flex justify-end pt-4">
                  <PaginationButtons size={18} pages={pages} />
                </div>
              </div>
            </Show>
          )}
        </Show>
      </div>
    </ChartCard>
  );
};

interface QueryCardProps {
  search_query_event: SearchQueryEvent;
}
const SearchQueryEventCard = (props: QueryCardProps) => {
  return (
    <tr>
      <td class="w-full max-w-0 truncate">{props.search_query_event.query}</td>
      <td class="text-right">
        {JSON.parse(props.search_query_event.request_params)["search_type"]}
      </td>
    </tr>
  );
};

const formatSortBy = (sortBy: SortBy) => {
  switch (sortBy) {
    case "created_at":
      return "Created At";
    case "latency":
      return "Latency";
    case "top_score":
      return "Top Score";
    default:
      return sortBy;
  }
};

const formatSortOrder = (sortOrder: SortOrder) => {
  switch (sortOrder) {
    case "asc":
      return "Ascending";
    case "desc":
      return "Descending";
    default:
      return sortOrder;
  }
};
