import { createEffect, createSignal, For, Show } from "solid-js";
import { PaginationButtons } from "../PaginationButtons";
import { ChartCard } from "./ChartCard";
import {
  RAGAnalyticsFilter,
  SortOrder,
  RagQueryEvent,
  SortBy,
} from "../../../types";
import { getRAGQueries } from "../api/analytics";
import { Select } from "../Select";
import { usePagination } from "../usePagination";
import { parseCustomDateString } from "./LatencyGraph";
import { format } from "date-fns";

interface RagQueriesProps {
  filter: RAGAnalyticsFilter;
}

const ALL_SORT_BY: SortBy[] = ["created_at", "latency", "top_score"];
const ALL_SORT_ORDER: SortOrder[] = ["asc", "desc"];

export const RagQueries = (props: RagQueriesProps) => {
  const pages = usePagination();

  const [sortBy, setSortBy] = createSignal<SortBy>("created_at");
  const [sortOrder, setSortOrder] = createSignal<SortOrder>("desc");
  const [ragQueries, setRagQueries] = createSignal<RagQueryEvent[]>([]);

  createEffect(() => {
    const curPage = pages.page();
    getRAGQueries({
      page: curPage,
      filter: props.filter,
      sort_by: sortBy(),
      sort_order: sortOrder(),
    }).then((results) => {
      if (results.length === 0) {
        pages.setMaxPageDiscovered(curPage);
      }

      setRagQueries(results);
    });
  });

  return (
    <ChartCard
      title="RAG Queries"
      tooltipText="This table will soon be updated to show all data being collected and available through the analytics API resource"
      subtitle="All RAG Queries"
      class="flex flex-col px-4"
      width={2}
      controller={
        <div class="flex gap-2">
          <Select
            class="min-h-7 min-w-[80px] bg-neutral-100/90"
            options={ALL_SORT_BY.map((e) => formatSortBy(e))}
            selected={formatSortBy(sortBy())}
            onSelected={(e) =>
              setSortBy(ALL_SORT_BY.find((s) => formatSortBy(s) === e)!)
            }
          />
          <Select
            class="min-h-7 min-w-[80px] bg-neutral-100/90"
            options={ALL_SORT_ORDER.map((e) => formatSortOrder(e))}
            selected={formatSortOrder(sortOrder())}
            onSelected={(e) =>
              setSortOrder(
                ALL_SORT_ORDER.find((s) => formatSortOrder(s) === e)!,
              )
            }
          />
        </div>
      }
    >
      <div>
        <Show when={ragQueries().length === 0}>
          <div class="py-8 text-center opacity-80">No Data.</div>
        </Show>
        <Show
          fallback={<div class="py-8 text-center">Loading...</div>}
          when={ragQueries()}
        >
          {(data) => (
            <Show when={data().length > 0}>
              <div class="pt-2">
                <table class="w-full">
                  <thead>
                    <tr>
                      <th class="text-left font-semibold">Message</th>
                      <th class="pl-2 text-left font-semibold">Sent At</th>
                      <th class="text-right font-semibold">RAG Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    <For each={data()}>
                      {(rag_query_event) => {
                        return (
                          <RagQueryEventCard
                            rag_query_event={rag_query_event}
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
  rag_query_event: RagQueryEvent;
}
const RagQueryEventCard = (props: QueryCardProps) => {
  return (
    <tr>
      <td class="truncate">{props.rag_query_event.user_message}</td>
      <td class="pr-8 text-right">
        {format(
          parseCustomDateString(props.rag_query_event.created_at),
          "M/d/yy h:mm a",
        )}
      </td>
      <td class="text-right">{props.rag_query_event.rag_type}</td>
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
