import { For, Show, createEffect, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import { DatasetIDs, isScoreChunkDTO } from "./types";

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

  const dateRangeSwitch = (value: string) => {
    switch (value) {
      case "All Time":
        return ["", new Date().toISOString()];
      case "Last 24h":
        return [
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ];
      case "Past Week":
        return [
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ];
      case "Past Month":
        return [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ];
      case "Past Year":
        return [
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ];
        break;
      case "Custom Range":
        //TODO: Implement custom range
        break;
      default:
        break;
    }
  };

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
          setStories(stories);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
    setLoading(false);
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
