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
  const [loading, setLoading] = createSignal(false);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [page, setPage] = createSignal(1);

  createEffect(on([query, dateBias, dateRange, selectedDataset],() => {
    setStories([]);
    setPage(1);
  }));

  createEffect(() => {
    if (query() === "") {
      setStories([]);
      return;
    }
    setLoading(true);

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
        search_type: "hybrid",
        page: page(),
        highlight_results: true,
        highlight_delimiters: [" "],
        date_bias: dateBias(),
        time_range: dateRangeSwitch(dateRange()),
        filters: story_types[selectedDataset()]
          ? { type: story_types[selectedDataset()] }
          : {},
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
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    setLoading(false);
  });

  const handleScroll = () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
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
      <Show when={stories().length > 0 && !loading()}>
        <For each={stories()}>{(story) => <Stories story={story} />}</For>
        <div class="p-3" />
      </Show>
      <Show when={stories().length === 0 && !loading()}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">No stories found</span>
        </div>
      </Show>
      <Show when={loading()}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">Loading...</span>
        </div>
      </Show>
      <div class="flex-1" />
    </main>
  );
}
