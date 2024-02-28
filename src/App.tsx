import { For, Show, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import { isScoreChunkDTO } from "./types";

export default function App() {
  //replace with dataset ids
  const trive_api_key = import.meta.env.VITE_TRIEVE_API_KEY;
  const story_types = {
    All: null,
    Stories: "story",
    Comments: "comment",
    Polls: "poll",
    Jobs: "job",
  };

  const [selectedDataset, setSelectedDataset] = createSignal("Stories");
  const [dateBias, setDateBias] = createSignal(false);
  const [dateRange, setDateRange] = createSignal<string[]>([
    "All Time",
    "",
    new Date().toISOString(),
  ]);
  const [stories, setStories] = createSignal<Story[]>([]);
  const [loading, setLoading] = createSignal(false);

  const search = (query: string) => {
    if (query === "") {
      setStories([]);
      return;
    }
    setLoading(true);
    fetch(`https://api.trieve.ai/api/chunk/search`, {
      method: "POST",
      body: JSON.stringify({
        query: query,
        search_type: "hybrid",
        highlight_results: true,
        highlight_delimiters: [" "],
        date_bias: dateBias(),
        time_range: dateRange().slice(1),
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
  };

  return (
    <main class="bg-hn min-h-screen font-verdana">
      <Header search={search} />
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
