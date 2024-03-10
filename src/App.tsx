import { For, Show, createEffect, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import {
  DatasetIDs,
  dateRangeSwitch,
  getFilters,
  isChunkMetadataWithFileData,
  isScoreChunkDTO,
} from "./types";
import { PaginationController } from "./components/PaginationController";

export default function App() {
  //replace with dataset ids
  const trive_api_key = import.meta.env.VITE_TRIEVE_API_KEY;
  const api_base_url = import.meta.env.VITE_TRIEVE_API_BASE_URL;
  const story_types: DatasetIDs = {
    All: null,
    Stories: "story",
    Comments: "comment",
    Polls: "poll",
    Jobs: "job",
  };

  const urlParams = new URLSearchParams(window.location.search);

  const [selectedDataset, setSelectedDataset] = createSignal(
    urlParams.get("dataset") ?? "Stories",
  );
  const [sortBy, setSortBy] = createSignal(
    urlParams.get("sortby") ?? "relevance",
  );
  const [dateRange, setDateRange] = createSignal<string>(
    urlParams.get("dateRange") ?? "All Time",
  );
  const [stories, setStories] = createSignal<Story[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [searchType, setSearchType] = createSignal(
    urlParams.get("searchType") ?? "hybrid",
  );
  const [page, setPage] = createSignal(Number(urlParams.get("page") ?? "1"));
  const [totalPages, setTotalPages] = createSignal(0);

  createEffect(async () => {
    setLoading(true);
    if (query() === "") {
      async function fetchTopStories() {
        const response = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty",
        );
        const storyIds = await response.json();
        const topStoryIds = storyIds.slice(0, 20); // Limit to first 10 stories for example

        const storyDetails = await Promise.all(
          topStoryIds.map((id: number) =>
            fetch(
              `https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`,
            ).then((res) => res.json()),
          ),
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

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`,
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
        use_weights: sortBy() == "popularity",
        date_bias: sortBy() == "date",
        filters: getFilters(story_types[selectedDataset()], time_range),
        page_size: 20,
        score_threshold: 0.3,
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID,
        Authorization: trive_api_key,
      },
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
          setTotalPages(data.total_chunk_pages);
          setStories(stories);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  const getRecommendations = async (story_id: string) => {
    let recommendations: Story[] = [];
    let time_range = dateRangeSwitch(dateRange());

    await fetch(api_base_url + `/api/chunk/recommend`, {
      method: "POST",
      body: JSON.stringify({
        positive_tracking_ids: [story_id],
        filters: getFilters(story_types[selectedDataset()], time_range),
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
              content: chunk.content,
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
        console.error("Error:", error);
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
      />
      <div
        classList={{
          "animate-pulse": loading(),
        }}>
        <For each={stories()}>
          {(story) => (
            <Stories story={story} getRecommendations={getRecommendations} />
          )}
        </For>
        <div class="mx-auto my-3 flex items-center space-x-2 justify-center">
          <PaginationController
            page={page()}
            setPage={setPage}
            totalPages={totalPages()}
          />
        </div>
      </div>
      <div class="p-3" />
      <Show when={stories().length === 0 && !loading()}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">No stories found</span>
        </div>
      </Show>
    </main>
  );
}
