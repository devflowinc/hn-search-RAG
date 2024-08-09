/* eslint-disable solid/reactivity */
import { Show } from "solid-js";
import { formatDistanceToNowStrict } from "date-fns";

const formatLink = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    if (hostname === "github.com") {
      const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        return `${hostname}/${pathParts[0]}`;
      }
      return hostname;
    }

    return hostname;
  } catch (e) {
    console.error("Invalid URL:", e);
    return url;
  }
};

export interface Story {
  score?: number;
  title_html?: string;
  body_html?: string;
  parent_id?: string;
  parent_title?: string;
  url: string;
  points: number;
  user: string;
  time: Date;
  title?: string;
  kids: string[];
  type: string;
  id: string;
}

export const Story = (props: {
  story: Story;
  sendCTR: () => void;
  onClickRecommend: () => void;
}) => {
  const articleLink =
    "https://news.ycombinator.com/item?id=" +
    props.story.id.replaceAll("<mark><b>", "").replaceAll("</b></mark>", "");

  return (
    <div class="rounded-md px-2 pb-3">
      <div class="flex flex-wrap items-center">
        <Show when={props.story.title_html}>
          <div
            class="break-word mb-[-6px] w-full text-wrap leading-[14pt] text-[#828282]"
            onClick={() => props.sendCTR()}
          >
            <a
              href={articleLink}
              class="mr-1 text-wrap text-[11pt] text-black sm:text-[10pt]"
              // eslint-disable-next-line solid/no-innerhtml
              innerHTML={props.story.title_html}
            />
            <Show when={props.story.url}>
              <a
                href={props.story.url
                  .replaceAll("<mark><b>", "")
                  .replaceAll("</b></mark>", "")}
                class="break-all text-[8pt] text-[#828282] hover:underline"
              >
                ({formatLink(props.story.url)})
              </a>
            </Show>
          </div>
        </Show>
        <div class="w-full items-center pt-1 text-[9pt] text-[#828282] sm:text-[7pt]">
          <span>
            {props.story.points} points by{" "}
            <a
              href={`https://news.ycombinator.com/user?id=${props.story.user
                .replaceAll("<mark><b>", "")
                .replaceAll("</b></mark>", "")}`}
              class="hover:underline"
            >
              {props.story.user}
            </a>{" "}
            <a href={articleLink} class="hover:underline">
              {/* if story over 1 year ago show mmmm DD, YYYY */}
              {props.story.time.getTime() > new Date().getTime() - 31536000000
                ? formatDistanceToNowStrict(props.story.time, {
                    addSuffix: true,
                  })
                : new Date(props.story.time).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
            </a>
          </span>
          <span class="px-1">|</span>
          <a href={articleLink} class="hover:underline">
            {props.story.kids.length
              ? `${props.story.kids.length} ${
                  props.story.kids.length > 1 ? "comments" : "comment"
                }`
              : "context"}
          </a>
          <Show when={props.story.score}>
            <span class="px-1">|</span>
            <span>Score {props.story.score?.toFixed(3)}</span>
          </Show>
          <Show when={props.story.type != "comment"}>
            <span class="px-1">|</span>
            <span
              class="cursor-pointer font-semibold hover:underline"
              onClick={() => props.onClickRecommend()}
            >
              Get Recommendations
            </span>
          </Show>
          <Show when={props.story.parent_title}>
            <span class="px-1">|</span>
            <span>
              on:{" "}
              <a
                href={`https://news.ycombinator.com/item?id=${props.story.parent_id
                  ?.replaceAll("<mark><b>", "")
                  .replaceAll("</b></mark>", "")}`}
                class="hover:underline"
              >
                {props.story.parent_title}
              </a>
            </span>
          </Show>
        </div>
        <Show when={props.story.body_html}>
          <div class="break-word w-full text-wrap pt-1 leading-[normal] text-[#828282]">
            <div
              classList={{
                "mr-1 text-[10pt] sm:text-[10pt] text-wrap": true,
                "pl-2 text-[#828282]": props.story.title_html ? true : false,
                "text-black": !props.story.title_html,
              }}
              id="comment-parent"
              // eslint-disable-next-line solid/no-innerhtml
              innerHTML={props.story.body_html}
            />
          </div>
        </Show>
      </div>
    </div>
  );
};
