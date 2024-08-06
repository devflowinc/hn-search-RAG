import { createEffect, createMemo, createSignal, JSX, Match, Show, Switch } from "solid-js";
import { PaginationButtons } from "../PaginationButtons";
import { ChartCard } from "./ChartCard";
import { usePagination } from "../usePagination";
import {
  AnalyticsFilter,
  SortBy,
  SortOrder,
  SearchQueryEvent,
  AnalyticsParams,
} from "../../../types";
import { getSearchQueries } from "../api/analytics";
import { AiFillCaretDown } from "solid-icons/ai";
import { Table, Tr, Th, Td } from "../Table";
import { format } from "date-fns";
import { parseCustomDateString } from "./LatencyGraph";

interface SearchQueriesProps {
  params: { filter: AnalyticsFilter };
}

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

  interface SortableHeaderProps {
    children: JSX.Element;
    sortBy: "created_at" | "latency" | "top_score";
  }
  const SortableHeader = (props: SortableHeaderProps) => {
    return (
      <button
        onClick={() => {
          if (sortBy() === props.sortBy) {
            setSortOrder(sortOrder() === "desc" ? "asc" : "desc");
          } else {
            setSortBy(props.sortBy);
          }
        }}
        class="flex items-center gap-2"
      >
        <div>{props.children}</div>
        <Switch>
          <Match when={sortBy() === props.sortBy && sortOrder() === "desc"}>
            <AiFillCaretDown />
          </Match>
          <Match when={sortBy() === props.sortBy && sortOrder() === "asc"}>
            <AiFillCaretDown class="rotate-180 transform" />
          </Match>
        </Switch>
      </button>
    );
  };

  return (
    <ChartCard
      title="All Search Queries"
      class="flex flex-col px-4"
      width={2}
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
            <div classList={{ "border border-neutral-300": data().length > 0 }}>
              <Table
                fixed
                headers={
                  <Tr>
                    <Th class="w-[20vw]">Query</Th>
                    <Th class="w-[10vw]">
                      <SortableHeader sortBy="created_at">
                        Searched At
                      </SortableHeader>
                    </Th>
                    <Show
                      when={typeof props.params.filter.search_method === "undefined"}
                    >
                      <Th class="w-[10vw]">Search Method</Th>
                    </Show>
                    <Th class="w-[10vw] text-right">
                      <SortableHeader sortBy="latency">Latency</SortableHeader>
                    </Th>
                    <Th class="w-[15vw] text-right">
                      <SortableHeader sortBy="top_score">
                        Top Score
                      </SortableHeader>
                    </Th>
                  </Tr>
                }
                fallback={<div class="py-8 text-center">No Data</div>}
                data={data()}
              >
                {(row) => <SearchRow event={row} filter={props.params.filter} />}
              </Table>
              <div class="flex justify-end px-2 py-1">
                <PaginationButtons size={14} pages={pages} />
              </div>
            </div>
          )}
        </Show>
      </div>
    </ChartCard>
  );
};

interface SearchRowProps {
  event: SearchQueryEvent;
  filter: AnalyticsParams["filter"];
}
const SearchRow = (props: SearchRowProps) => {
  const searchMethod = createMemo(() => {

    return typeof (props.event.request_params ?? {})["search_type"] === "string"
      ? formatSearchMethod((props.event.request_params ?? {})["search_type"] as string)
      : "All";
  });
  return (
    <Tr>
      <Td class="truncate">{props.event.query}</Td>
      <Td>
        {format(parseCustomDateString(props.event.created_at), "M/d/yy h:mm a")}
      </Td>
      <Show when={typeof props.filter.search_method === "undefined"}>
        <Td>{searchMethod()}</Td>
      </Show>
      <Td class="text-left">{props.event.latency} ms</Td>
      <Td class="truncate text-left">{props.event.top_score}</Td>
    </Tr>
  );
};

const formatSearchMethod = (searchMethod: string) => {
  switch (searchMethod) {
    case "hybrid":
      return "Hybrid";
    case "fulltext":
      return "Fulltext";
    case "semantic":
      return "Semantic";
    default:
      return "All";
  }
};
