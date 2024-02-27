import { createSignal } from "solid-js";
export interface Story {
    title: string;
    url: string;
    points: number;
    user: string;
    time: string;
    commentsCount: number;
}

export default function Stories(props: { story: Story }) {
  return (
    <div class="p-1 px-4 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center flex-wrap">
          <div class="w-full mb-[-6px]">
            <a
              href={props.story.url}
              class="transition duration-150 ease-in-out mr-1 text-md text-[14px]">
              {props.story.title}
            </a>
            <a
              href={props.story.url}
              class="text-gray-500 text-[13px] hover:underline">
              ({props.story.url})
            </a>
          </div>
          <div class="w-full">
            <a
              href={props.story.url}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.points} points
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={props.story.url}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.user}
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={props.story.url}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.time}
            </a>
            <span class="text-gray-500 text-xs">{" | "}</span>
            <a
              href={props.story.url}
              class="text-gray-500 text-[10.6667px] hover:underline">
              {props.story.commentsCount} comments
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
