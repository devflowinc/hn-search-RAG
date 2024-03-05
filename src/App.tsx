import { For, Show, createEffect, createSignal, on } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import { DatasetIDs, dateRangeSwitch, isScoreChunkDTO } from "./types";

export default function App() {
  //replace with dataset ids
  const trive_api_key = import.meta.env.VITE_TRIEVE_API_KEY;
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
  const [dateBias, setDateBias] = createSignal(
    urlParams.get("dateBias") === "true",
  );
  const [dateRange, setDateRange] = createSignal<string>(
    urlParams.get("dateRange") ?? "All Time",
  );
  const [stories, setStories] = createSignal<Story[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [gettingMore, setGettingMore] = createSignal(false);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [page, setPage] = createSignal(1);

  createEffect(
    on(
      [query, dateBias, dateRange, selectedDataset],
      () => {
        setStories([]);
        setPage(1);
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    if (query() === "") {
      setStories([]);
      return;
    }

    urlParams.set("q", query());
    urlParams.set("dataset", selectedDataset());
    urlParams.set("dateBias", dateBias().toString());
    urlParams.set("dateRange", dateRange());

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`,
    );
    fetch(`https://api.trieve.ai/api/chunk/search`, {
      method: "POST",
      body: JSON.stringify({
        query: query(),
        search_type: "semantic",
        page: page(),
        highlight_results: true,
        highlight_delimiters: [" "],
        date_bias: dateBias(),
        time_range: dateRangeSwitch(dateRange()),
        filters: story_types[selectedDataset()]
          ? { type: story_types[selectedDataset()] }
          : {},
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
          setStories((prev) => prev.concat(stories));
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      setGettingMore(true);
      setPage((prev) => prev + 1);
    }
  };

  createEffect(() => {
    window.addEventListener("scroll", handleScroll);
  });

  return (
    <main class="bg-hn min-h-screen font-verdana">
      <Header query={query} setQuery={setQuery} />
      <Filters
        selectedDataset={selectedDataset}
        setSelectedDataset={setSelectedDataset}
        dateBias={dateBias}
        setDateBias={setDateBias}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      <Show when={stories().length > 0}>
        <For each={stories()}>{(story) => <Stories story={story} />}</For>
        <Show when={gettingMore()}>
          <div class="flex justify-center items-center ">
            <div role="status">
              <svg
                aria-hidden="true"
                class="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span class="sr-only">Loading...</span>
            </div>
          </div>
        </Show>
        <div class="p-3" />
      </Show>
      <Show when={stories().length === 0}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">No stories found</span>
        </div>
      </Show>
    </main>
  );
}
