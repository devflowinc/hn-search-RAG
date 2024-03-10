import { For, Show, createSignal } from "solid-js";
import { formatDistanceToNowStrict } from "date-fns";
export interface Story {
  content: string;
  url: string;
  points: number;
  user: string;
  time: string;
  commentsCount: number;
  type: string;
  id: string;
}

export default function Stories(props: {
  story: Story;
  getRecommendations: (story_id: string) => Promise<Story[]>;
}) {
  const article_link = "https://news.ycombinator.com/item?id=" + props.story.id;
  const [recommendations, setRecommendations] = createSignal<Story[]>([]);
  const [showSimilar, setShowSimilar] = createSignal(false);
  const [loadingRecommendations, setLoadingRecommendations] =
    createSignal(false);
  return (
    <div class="p-1 px-4 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center flex-wrap">
          <Show when={props.story.type != "comment"}>
            <div class="w-full mb-[-6px]">
              <a
                href={article_link}
                class="transition duration-150 ease-in-out mr-1 text-md text-[12px]"
                innerHTML={props.story.content}
              />
              <a
                href={props.story.url}
                class="text-gray-500 text-[13px] hover:underline">
                ({props.story.url})
              </a>
            </div>
          </Show>
          <div class="w-full">
            <a
              href={article_link}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.points} points
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={article_link}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.user}
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={article_link}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {formatDistanceToNowStrict(props.story.time)} ago
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={article_link}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.commentsCount} comments
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <span
              classList={{
                "text-gray-500 text-[10.6667px]": true,
                "cursor-pointer hover:underline": !loadingRecommendations(),
                "animate-pulse": loadingRecommendations(),
              }}
              onClick={() => {
                if (recommendations().length == 0) {
                  setLoadingRecommendations(true);
                  props.getRecommendations(props.story.id).then((data) => {
                    setRecommendations(data);
                    setShowSimilar(true);
                    setLoadingRecommendations(false);
                  });
                  return;
                }
                setShowSimilar(!showSimilar());
              }}>
              {showSimilar() ? "Collapse" : "Show"} Similar
            </span>
          </div>
          <Show when={props.story.type == "comment"}>
            <div class="w-full mb-[-6px] pl-1">
              <div
                class="transition duration-150 ease-in-out mr-1 text-md text-[12px]"
                innerHTML={props.story.content}
              />
            </div>
          </Show>
          <Show when={recommendations().length > 0 && showSimilar()}>
            <div class="pr-3">
              <For each={recommendations()}>
                {(story) => (
                  <Stories
                    story={story}
                    getRecommendations={props.getRecommendations}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
