import { For, Show, createSignal } from "solid-js";
import Filters from "./components/Filters";
import Header from "./components/Header";
import Stories, { Story } from "./components/Stories";
import { isScoreChunkDTO } from "./types";

export default function App() {
  //replace with dataset ids
  const dataset_ids = {
    Stories: import.meta.env.VITE_STORIES_DATASET_ID,
    Comments: import.meta.env.VITE_COMMENTS_DATASET_ID,
    "Ask HN": "ask_hn",
    "Show HN": "show_hn",
    Jobs: "jobs",
    Polls: "polls",
  };
  const trive_api_key = import.meta.env.VITE_TRIVE_API_KEY;

  const [selectedDataset, setSelectedDataset] = createSignal("Stories");
  const [dateBias, setDateBias] = createSignal(false);
  const [dateRange, setDateRange] = createSignal<string[]>([
    "All Time",
    "",
    new Date().toISOString(),
  ]);
  const [stories, setStories] = createSignal<Story[]>([]);

  const [search] = createSignal((query: string) => {
    if (query === "") {
      setStories([]);
      return;
    }

    fetch(`https://api.trieve.ai/api/chunk/search`, {
      method: "POST",
      body: JSON.stringify({
        query: query,
        search_type: "hybrid",
        date_bias: dateBias(),
        time_range: dateRange().slice(1),
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": dataset_ids[selectedDataset()],
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
                title: story.content,
                url: story.link ?? "",
                points: story.metadata?.score ?? 0,
                user: story.metadata?.by ?? "",
                time: story.time_stamp ?? "",
                commentsCount: story.metadata?.descendants ?? 0,
              };
            }) ?? [];
          setStories(stories);
        }
      }).catch((error) => {
        console.error("Error:", error);
      }
      );
  });

  return (
    <main class="bg-hn h-screen font-verdana">
      <Header search={search} />
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
      </Show>
      <Show when={stories().length === 0}>
        <div class="flex justify-center items-center ">
          <span class="text-2xl">No stories found</span>
        </div>
      </Show>
      <div class="flex-1" />
    </main>
  );
}
