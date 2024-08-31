import {
  createEffect,
  createMemo,
  createSignal,
  JSX,
  Match,
  Show,
  Switch,
} from "solid-js";
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
import { FullScreenModal } from "../../FullScreenModal";

interface SearchQueriesProps {
  params: { filter: AnalyticsFilter };
}

export const SearchQueries = (props: SearchQueriesProps) => {
  const pages = usePagination();

  const [sortBy, setSortBy] = createSignal<SortBy>("created_at");
  const [sortOrder, setSortOrder] = createSignal<SortOrder>("desc");
  const [searchQueries, setSearchQueries] = createSignal<SearchQueryEvent[]>(
    [],
  );

  createEffect(() => {
    const curPage = pages.page();

    getSearchQueries(props.params.filter, sortBy(), sortOrder(), curPage).then(
      (results) => {
        if (results.length === 0) {
          pages.setMaxPageDiscovered(curPage);
        }
        setSearchQueries(results);
      },
    );
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
      class="flex flex-col px-4"
      width={2}
      title="All Search Queries"
      tooltipText="Autocomplete search-as-you-type sub-sentences are collapsed on a 10-minute interval. Queries which are a substring of another query which occurred within 30 seconds are collapsed into the longest parent query. At most 10 queries are collapsed into a single parent."
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
                      when={
                        typeof props.params.filter.search_method === "undefined"
                      }
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
                    <Th class="w-[10vw]">View Params and Results</Th>
                  </Tr>
                }
                fallback={<div class="py-8 text-center">No Data</div>}
                data={data()}
              >
                {(row) => (
                  <SearchRow event={row} filter={props.params.filter} />
                )}
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
  const [openParamResults, setOpenParamResults] = createSignal(false);
  const searchMethod = createMemo(() => {
    return typeof (props.event.request_params ?? {})["search_type"] === "string"
      ? formatSearchMethod(
          (props.event.request_params ?? {})["search_type"] as string,
        )
      : "All";
  });
  return (
    <>
      <Tr>
        <Td class="truncate">{props.event.query}</Td>
        <Td>
          {format(
            parseCustomDateString(props.event.created_at),
            "M/d/yy h:mm a",
          )}
        </Td>
        <Show when={typeof props.filter.search_method === "undefined"}>
          <Td>{searchMethod()}</Td>
        </Show>
        <Td class="text-left">{props.event.latency} ms</Td>
        <Td class="truncate text-left">
          {props.event.top_score
            ? props.event.top_score.toFixed(2)
            : "N/A due to sort"}
        </Td>
        <Td class="truncate">
          <button
            class="text-[#ff6600]"
            onClick={() => setOpenParamResults(true)}
          >
            View
          </button>
        </Td>
      </Tr>
      <FullScreenModal show={openParamResults} setShow={setOpenParamResults}>
        <div class="flex w-[60vw] flex-col gap-4">
          <div class="flex space-x-2">
            <h2 class="text-xl font-bold">Request Params</h2>
            <button
              class="text-sm text-[#ff6600]"
              onClick={(e) => {
                navigator.clipboard.writeText(
                  JSON.stringify(props.event.request_params, null, 2),
                );

                const target = e.target as HTMLButtonElement;
                target.textContent = "Copied";
                setTimeout(() => {
                  target.textContent = "Copy";
                }, 500);
              }}
            >
              Copy
            </button>
          </div>
          <pre class="text-sm">
            {JSON.stringify(props.event.request_params, null, 2)}
          </pre>
          <div class="flex space-x-2">
            <h2 class="text-xl font-bold">Results</h2>
            <button
              class="text-sm text-[#ff6600]"
              onClick={(e) => {
                navigator.clipboard.writeText(
                  JSON.stringify(props.event.request_params, null, 2),
                );

                const target = e.target as HTMLButtonElement;
                target.textContent = "Copied";
                setTimeout(() => {
                  target.textContent = "Copy";
                }, 500);
              }}
            >
              Copy
            </button>
          </div>
          <pre class="text-sm">
            {JSON.stringify(props.event.results, null, 2)}
          </pre>
        </div>
      </FullScreenModal>
    </>
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
    case "bm25":
      return "BM25";
    case "rag":
      return "Query made by RAG";
    default:
      return "All";
  }
};
