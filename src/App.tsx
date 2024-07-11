import { For, Match, Switch, createEffect, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import { Story } from "./components/Story";
import {
  dateRangeSwitch,
  getFilters,
  SearchChunkQueryResponseBody,
} from "./types";
import { PaginationController } from "./components/PaginationController";
import { Search } from "./components/Search";

export const App = () => {
  const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY;
  const trieveBaseURL = import.meta.env.VITE_TRIEVE_API_URL;
  const trieveDatasetId = import.meta.env.VITE_TRIEVE_DATASET_ID;
  const urlParams = new URLSearchParams(window.location.search);

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
    urlParams.get("searchType") ?? "semantic"
  );
  const [page, setPage] = createSignal(Number(urlParams.get("page") ?? "1"));
  const [algoliaLink, setAlgoliaLink] = createSignal("");
  const [latency, setLatency] = createSignal<number | null>(null);
  const [count, setCount] = createSignal<number | null>(null);

  createEffect(async () => {
    setLoading(true);
    setCount(null);

    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();
    const { signal } = abortController;

    if (query() === "") {
      async function fetchTopStories() {
        const response = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
          { signal }
        );
        const storyIds = await response.json();
        const topStoryIds = storyIds.slice(0, 20); // Limit to first 10 stories for example

        const storyDetails = await Promise.all(
          topStoryIds.map((id: number) =>
            fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`,
              { signal }
            ).then((res) => res.json())
          )
        );

        setLoading(false);

        return storyDetails;
      }

      let storyDetails = await fetchTopStories();
      let stories: Story[] = storyDetails.map((story) => ({
        content: story.title,
        url: story.url,
        points: story.score,
        user: story.by,
        time: story.time,
        commentsCount: story.descendants,
        type: story.type,
        id: story.id,
      }));
      setStories(stories);
      return;
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

    let time_range = dateRangeSwitch(dateRange());

    fetch(`${trieveBaseURL}/chunk/count`, {
      method: "POST",
      body: JSON.stringify({
        query: query(),
        search_type: searchType(),
        filters: getFilters(selectedDataset(), time_range),
        limit: 10000,
        score_threshold: 0.8,
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
        Authorization: trieveApiKey,
      },
      signal,
    })
      .then((response) => response.json())
      .then((data) => {
        setCount(data.count);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error fetching count:", error);
        }
      });

    fetch(`${trieveBaseURL}/chunk/search`, {
      method: "POST",
      body: JSON.stringify({
        query: query(),
        search_type: searchType(),
        page: page(),
        highlight_results: true,
        highlight_delimiters: [" "],
        use_weights: sortBy() != "Relevance",
        date_bias: sortBy() == "Date",
        filters: getFilters(selectedDataset(), time_range),
        page_size: 20,
        score_threshold: 0.3,
      }),
      headers: {
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
          data.score_chunks.map((chunk): Story => {
            const story = chunk.metadata[0];
            return {
              content: story.chunk_html ?? "",
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
        if (error.name !== "AbortError") {
          console.error("Error:", error);
          setLoading(false);
        }
      });
  });

  const getRecommendations = async (story_id: string) => {
    let recommendations: Story[] = [];
    let time_range = dateRangeSwitch(dateRange());

    fetch(trieveBaseURL + `/api/chunk/recommend`, {
      method: "POST",
      body: JSON.stringify({
        positive_tracking_ids: [story_id.toString()],
        filters: getFilters(selectedDataset(), time_range),
        limit: 3,
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID,
        Authorization: trieveApiKey,
      },
    })
      .then((response) => response.json())
      .then((data: any[]) => {
        const stories: Story[] = data.map((chunk): Story => {
          return {
            content: chunk.chunk_html ?? "",
            url: chunk.link ?? "",
            points: chunk.metadata?.score ?? 0,
            user: chunk.metadata?.by ?? "",
            time: chunk.time_stamp ?? "",
            commentsCount: chunk.metadata?.descendants ?? 0,
            type: chunk.metadata?.type ?? "",
            id: chunk.tracking_id ?? "0",
          };
        });
        recommendations = stories;
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error:", error);
        }
      });

    return recommendations;
  };

  return (
    <main class="bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header algoliaLink={algoliaLink} />
      <Filters
        selectedDataset={selectedDataset}
        setSelectedDataset={setSelectedDataset}
        sortBy={sortBy}
        setSortBy={setSortBy}
        dateRange={dateRange}
        setDateRange={setDateRange}
        searchType={searchType}
        setSearchType={setSearchType}
        latency={latency}
        count={count}
      />
      <Search query={query} setQuery={setQuery} />
      <Switch>
        <Match when={stories().length === 0}>
          <Switch>
            <Match when={loading()}>
              <div class="flex justify-center items-center py-2">
                <span class="text-2xl">Loading...</span>
              </div>
            </Match>
            <Match when={!loading()}>
              <div class="flex justify-center items-center py-2">
                <span class="text-2xl">No stories found</span>
              </div>
            </Match>
          </Switch>
        </Match>
        <Match when={stories().length > 0}>
          <For each={stories()}>
            {(story) => (
              <Story story={story} getRecommendations={getRecommendations} />
            )}
          </For>
          <div class="mx-auto py-3 flex items-center space-x-2 justify-center">
            <PaginationController
              page={page()}
              setPage={setPage}
              totalPages={500}
            />
          </div>
        </Match>
      </Switch>
    </main>
  );
};

export default App;
