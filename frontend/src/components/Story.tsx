import { Show } from "solid-js";
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

export const Story = (props: { story: Story }) => {
  const articleLink = "https://news.ycombinator.com/item?id=" + props.story.id;

  return (
    <div class="px-2 rounded-md pb-3">
      <div class="flex items-center flex-wrap">
        <Show when={props.story.type != "comment"}>
          <div class="w-full mb-[-6px] text-[#828282] text-wrap break-word leading-[14pt]">
            <a
              href={articleLink}
              class="mr-1 text-[11pt] sm:text-[10pt] text-black"
              innerHTML={props.story.content}
            />
            <a
              href={props.story.url}
              class="hover:underline text-[8pt] text-[#828282]"
            >
              ({props.story.url})
            </a>
          </div>
        </Show>
        <div class="w-full items-center text-[9pt] sm:text-[7pt] text-[#828282] pt-1 pb-2 sm:pb-0">
          <span>
            {props.story.points} points by{" "}
            <a
              href={`https://news.ycombinator.com/user?id=${props.story.user}`}
              class="hover:underline"
            >
              {props.story.user}
            </a>{" "}
            <a href={articleLink} class="hover:underline">
              {formatDistanceToNowStrict(props.story.time)} ago
            </a>
          </span>
          <span class="px-1">|</span>
          <a href={articleLink} class="hover:underline">
            {props.story.commentsCount} comments
          </a>
          <span class="px-1">|</span>
          <span
            class="cursor-pointer hover:underline font-semibold"
            onClick={() => {}}
          >
            Get Recommendations
          </span>
        </div>
        <Show when={props.story.type == "comment"}>
          <div class="w-full mb-[-6px] pl-3">
            <div
              class="transition duration-150 ease-in-out mr-1 text-md text-[12px] text-wrap space-y-2"
              innerHTML={props.story.content}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};
