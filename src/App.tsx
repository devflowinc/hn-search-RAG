import { For, Show, createEffect, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import {
  dateRangeSwitch,
  getFilters,
  isChunkMetadataWithFileData,
  isScoreChunkDTO,
} from "./types";
import { PaginationController } from "./components/PaginationController";

export default function App() {
  //replace with dataset ids
  const trive_api_key = import.meta.env.VITE_TRIEVE_API_KEY;
  const api_base_url = import.meta.env.VITE_TRIEVE_API_URL;
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

  createEffect(async () => {
    setLoading(true);
    // Cancel the previous request
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

    fetch(api_base_url + `/api/chunk/search`, {
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
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID,
        Authorization: trive_api_key,
      },
      signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (isScoreChunkDTO(data)) {
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
        }
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
    await fetch(api_base_url + `/api/chunk/recommend`, {
      method: "POST",
      body: JSON.stringify({
        positive_tracking_ids: [story_id.toString()],
        filters: getFilters(selectedDataset(), time_range),
        limit: 3,
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID,
        Authorization: trive_api_key,
      },
    })
      .then((response) => response.json())
      .then((data: any[]) => {
        if (data.every(isChunkMetadataWithFileData)) {
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
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error:", error);
        }
      });

    return recommendations;
  };

  return (
    <main class="bg-hn min-h-screen font-verdana">
      <Header query={query()} setQuery={setQuery} />
      <Filters
        selectedDataset={selectedDataset()}
        setSelectedDataset={setSelectedDataset}
        sortBy={sortBy()}
        setSortBy={setSortBy}
        dateRange={dateRange()}
        setDateRange={setDateRange}
        searchType={searchType()}
        setSearchType={setSearchType}
        algoliaLink={algoliaLink()}
      />
      <div
        classList={{
          "animate-pulse": loading(),
        }}
      >
        <For each={stories()}>
          {(story) => (
            <Stories story={story} getRecommendations={getRecommendations} />
          )}
        </For>
        <div class="mx-auto my-3 flex items-center space-x-2 justify-center">
          <PaginationController
            page={page()}
            setPage={setPage}
            totalPages={500}
          />
        </div>
      </div>
      <Show when={stories().length === 0 && loading()}>
        <For each={Array(20)}>
          {() => {
            // Generate a random width from 150px to 360px for the first line
            const maxWidthFirstLine =
              Math.floor(Math.random() * (560 - 150 + 1)) + 250;
            // Generate a random width from 150px to 330px for the second line
            const maxWidthSecondLine =
              Math.floor(Math.random() * (530 - 150 + 1)) + 250;

            return (
              <div role="status" class="animate-pulse p-1 px-3 rounded-md">
                <div
                  class={`h-2 bg-gray-300 rounded-full dark:bg-gray-700 mb-2.5`}
                  style={{ "max-width": maxWidthFirstLine + "px" }}
                ></div>
                <div
                  class={`h-2 bg-gray-300 rounded-full dark:bg-gray-700 mb-2.5`}
                  style={{ "max-width": maxWidthSecondLine + "px" }}
                ></div>

                <span class="sr-only">Loading...</span>
              </div>
            );
          }}
        </For>
      </Show>

      <div class="p-3" />
      <Show when={stories().length === 0 && !loading()}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">No stories found</span>
        </div>
      </Show>
    </main>
  );
}
