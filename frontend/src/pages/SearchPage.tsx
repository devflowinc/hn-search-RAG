import { For, Match, Show, Switch, createEffect, createSignal } from "solid-js";
import Filters from "../components/search/Filters";
import Header from "../components/Header";
import { Story } from "../components/search/Story";
import {
  dateRangeSwitch,
  getFilters,
  HNStory,
  SearchChunkQueryResponseBody,
  SearchOptions,
} from "../types";
import { PaginationController } from "../components/search/PaginationController";
import { Search } from "../components/search/Search";
import { Footer } from "../components/Footer";
import { createStore } from "solid-js/store";

const parseFloatOrNull = (val: string | null): number | null => {
  const num = parseFloat(val ?? "NaN");
  if (isNaN(num)) {
    return null;
  }
  return num;
};

const defaultScoreThreshold = (searchType: string): number => {
  switch (searchType) {
    case "semantic":
      return 0.7;
    case "hybrid":
      return 0.01;
    case "fulltext":
      return 7;
    default:
      return 0.3;
  }
};

export const SearchPage = () => {
  const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY as string;
  const trieveBaseURL = import.meta.env.VITE_TRIEVE_API_URL as string;
  const trieveDatasetId = import.meta.env.VITE_TRIEVE_DATASET_ID as string;
  const urlParams = new URLSearchParams(window.location.search);

  const defaultHighlightDelimiters = [" ", "-", "_", ".", ","];

  let abortController: AbortController | null = null;

  const [selectedDataset, setSelectedDataset] = createSignal(
    urlParams.get("dataset") ?? "all"
  );
  const [sortBy, setSortBy] = createSignal(
    urlParams.get("sortby") ?? "Relevance"
  );
  const [dateRange, setDateRange] = createSignal<string>(
    urlParams.get("dateRange") ?? "all"
  );
  const [stories, setStories] = createSignal<Story[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [searchType, setSearchType] = createSignal(
    urlParams.get("searchType") ?? "fulltext"
  );
  const [page, setPage] = createSignal(Number(urlParams.get("page") ?? "1"));
  const [algoliaLink, setAlgoliaLink] = createSignal("");
  const [latency, setLatency] = createSignal<number | null>(null);

  const [searchOptions, setSearchOptions] = createStore<SearchOptions>({
    scoreThreshold: parseFloatOrNull(urlParams.get("score_threshold")),
    pageSize: parseInt(urlParams.get("page_size") ?? "20"),
    highlightDelimiters:
      urlParams.get("highlight_delimiters")?.split(",") ??
      defaultHighlightDelimiters,
    highlightMaxLength: parseInt(urlParams.get("highlight_max_length") ?? "50"),
    highlightMaxNum: parseInt(urlParams.get("highlight_max_num") ?? "3"),
    highlightWindow: parseInt(urlParams.get("highlight_window") ?? "0"),
    recencyBias: parseFloatOrNull(urlParams.get("recency_bias")) ?? 0,
    slimChunks: urlParams.get("slim_chunks") === "true",
    highlightResults: (urlParams.get("highlight_results") ?? "true") === "true",
  });

  createEffect(() => {
    setSearchOptions("scoreThreshold", defaultScoreThreshold(searchType()));
  });

  createEffect(() => {
    setLoading(true);

    searchOptions.scoreThreshold &&
      urlParams.set(
        "score_threshold",
        searchOptions.scoreThreshold?.toString()
      );

    urlParams.set("page_size", searchOptions.pageSize.toString());
    urlParams.set(
      "highlight_delimiters",
      searchOptions.highlightDelimiters.join(",")
    );
    urlParams.set(
      "highlight_max_length",
      searchOptions.highlightMaxLength.toString()
    );
    urlParams.set(
      "highlight_max_num",
      searchOptions.highlightMaxNum.toString()
    );
    urlParams.set("highlight_window", searchOptions.highlightWindow.toString());
    urlParams.set("recency_bias", searchOptions.recencyBias.toString());
    urlParams.set("slim_chunks", searchOptions.slimChunks ? "true" : "false");
    urlParams.set(
      "highlight_results",
      searchOptions.highlightResults ? "true" : "false"
    );

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const { signal } = abortController;

    if (query() === "") {
      fetch(
        "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
        { signal }
      )
        .then((res) => res.json() as Promise<number[]>)
        .then((storyIds) => {
          const topStoryIds = storyIds.slice(0, 30);
          const storyDetails = Promise.all(
            topStoryIds.map((id: number) =>
              fetch(
                `https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`,
                { signal }
              ).then((res) => res.json() as Promise<HNStory>)
            )
          );
          return storyDetails;
        })
        .then((storyDetails) => {
          const stories: Story[] = storyDetails.map((story) => ({
            content: story.title,
            url: story.url,
            points: story.score,
            user: story.by,
            time: new Date(story.time * 1000).toUTCString(),
            commentsCount: story.descendants,
            type: story.type,
            id: story.id,
          }));
          setStories(stories);
        })
        .catch(() => console.log(""))
        .finally(() => setLoading(false));
    }

    urlParams.set("q", query());
    urlParams.set("dataset", selectedDataset());
    urlParams.set("sortby", sortBy());
    urlParams.set("dateRange", dateRange());
    urlParams.set("searchType", searchType());
    urlParams.set("page", page().toString());
    setAlgoliaLink(
      `https://hn.algolia.com/?q=${encodeURIComponent(
        query()
      )}&dateRange=${dateRange()}&sort=by${
        sortBy() == "Relevance" ? "Popularity" : sortBy()
      }&type=${selectedDataset()}&page=0&prefix=false`
    );

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`
    );

    const time_range = dateRangeSwitch(dateRange());

    let sort_by_field;
    if (sortBy() == "Date") {
      sort_by_field = "time_stamp";
    } else if (sortBy() == "Popularity") {
      sort_by_field = "num_value";
    } else {
      sort_by_field = undefined;
    }

    fetch(`${trieveBaseURL}/chunk/search`, {
      method: "POST",
      body: JSON.stringify({
        query: query(),
        search_type: searchType(),
        page: page(),
        highlight_results: searchOptions.highlightResults,
        highlight_delimiters: searchOptions.highlightDelimiters,
        highlight_max_num: searchOptions.highlightMaxNum,
        highlight_window: searchOptions.highlightWindow,
        highlight_max_length: searchOptions.highlightMaxLength,
        use_weights: sortBy() != "Relevance",
        sort_by: sort_by_field
          ? {
              field: sort_by_field,
              order: "desc",
            }
          : undefined,
        slim_chunks: searchOptions.slimChunks,
        filters: getFilters(selectedDataset(), time_range),
        page_size: searchOptions.pageSize,
        score_threshold: searchOptions.scoreThreshold,
      }),
      headers: {
        "X-API-VERSION": "V2",
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
        Authorization: trieveApiKey,
      },
      signal,
    })
      .then((response) => {
        const serverTiming = response.headers.get("Server-Timing");
        if (serverTiming) {
          const metrics = serverTiming.split(",");
          const durations = metrics.map((metric) => {
            const duration = parseFloat(metric.split(";")[1].split("=")[1]);
            return duration;
          });
          const totalLatency = durations.reduce((a, b) => a + b, 0);
          const latencyInSeconds = totalLatency / 1000;
          setLatency(latencyInSeconds);
        }
        return response.json();
      })
      .then((data: SearchChunkQueryResponseBody) => {
        const stories: Story[] =
          data.chunks.map((score_chunk): Story => {
            const story = score_chunk.chunk;
            return {
              content: story.chunk_html ?? "",
              score: score_chunk.score,
              url: story.link ?? "",
              points: story.metadata?.score ?? 0,
              user: story.metadata?.by ?? "",
              time: story.time_stamp ?? "",
              commentsCount: story.metadata?.descendants ?? 0,
              type: story.metadata?.type ?? "",
              id: story.tracking_id ?? "0",
            };
          }) ?? [];
        setStories(stories);
        setLoading(false);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          console.error("Error:", error);
          setLoading(false);
        }
      });
  });

  //const getRecommendations = async (story_id: string) => {
  //  let recommendations: Story[] = [];
  //  const time_range = dateRangeSwitch(dateRange());

  //  fetch(trieveBaseURL + `/api/chunk/recommend`, {
  //    method: "POST",
  //    body: JSON.stringify({
  //      positive_tracking_ids: [story_id.toString()],
  //      filters: getFilters(selectedDataset(), time_range),
  //      limit: 3,
  //    }),
  //    headers: {
  //      "Content-Type": "application/json",
  //      "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID as string,
  //      Authorization: trieveApiKey,
  //    },
  //  })
  //    .then((response) => response.json())
  //    .then((data: any[]) => {
  //      const stories: Story[] = data.map((chunk): Story => {
  //        return {
  //          content: chunk.chunk_html ?? "",
  //          url: chunk.link ?? "",
  //          points: chunk.metadata?.score ?? 0,
  //          user: chunk.metadata?.by ?? "",
  //          time: chunk.time_stamp ?? "",
  //          commentsCount: chunk.metadata?.descendants ?? 0,
  //          type: chunk.metadata?.type ?? "",
  //          id: chunk.tracking_id ?? "0",
  //        };
  //      });
  //      recommendations = stories;
  //    })
  //    .catch((error) => {
  //      if (error.name !== "AbortError") {
  //        console.error("Error:", error);
  //      }
  //    });

  //  return recommendations;
  //};

  return (
    <main class="bg-[#F6F6F0] sm:bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header algoliaLink={algoliaLink} />
      <Filters
        setSearchOptions={setSearchOptions}
        searchOptions={searchOptions}
        selectedDataset={selectedDataset}
        setSelectedDataset={setSelectedDataset}
        sortBy={sortBy}
        setSortBy={setSortBy}
        dateRange={dateRange}
        setDateRange={setDateRange}
        searchType={searchType}
        setSearchType={setSearchType}
        latency={latency}
      />
      <Search query={query} setQuery={setQuery} />
      <Switch>
        <Match when={stories().length === 0}>
          <Switch>
            <Match when={loading()}>
              <div class="flex justify-center items-center py-2">
                <span class="text-xl animate-pulse">Firebase loading...</span>
              </div>
            </Match>
            <Match when={!loading()}>
              <div class="flex justify-center items-center py-2">
                <span class="text-xl">No stories found</span>
              </div>
            </Match>
          </Switch>
        </Match>
        <Match when={stories().length > 0}>
          <div class="pb-2">
            <For each={stories()}>{(story) => <Story story={story} />}</For>
          </div>
        </Match>
      </Switch>
      <Show when={stories().length > 0 && query() != ""}>
        <div class="mx-auto py-3 flex items-center space-x-2 justify-center">
          <PaginationController
            page={page()}
            setPage={setPage}
            totalPages={500}
          />
        </div>
      </Show>
      <Footer />
    </main>
  );
};
