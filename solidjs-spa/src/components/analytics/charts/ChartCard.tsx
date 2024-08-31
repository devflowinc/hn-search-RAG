import { JSX, Show, splitProps } from "solid-js";
import { TrieveTooltip } from "../../TrieveTooltip";
import { AiOutlineInfoCircle } from "solid-icons/ai";

interface ChartCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title?: string;
  tooltipText?: string;
  subtitle?: string;
  width: number;
  children: JSX.Element;
  controller?: JSX.Element;
}

export const ChartCard = (props: ChartCardProps) => {
  const [classStuff, others] = splitProps(props, ["class"]);
  return (
    <div
      {...others}
      style={{
        "grid-column": `span ${props.width}`,
      }}
      class={`shadow-xs rounded-lg border border-neutral-300 bg-white p-2 ${classStuff.class}`}
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <Show when={props.title}>
              {(title) => (
                <div class="my-2 text-lg leading-none">{title()}</div>
              )}
            </Show>
            <Show when={props.tooltipText}>
              {(tooltipText) => (
                <TrieveTooltip
                  direction="right"
                  body={<AiOutlineInfoCircle class="h-4 w-4" />}
                  tooltipText={tooltipText()}
                />
              )}
            </Show>
          </div>
          <Show when={props.subtitle}>
            {(subtitle) => (
              <div class="text-sm leading-none text-neutral-600">
                {subtitle()}
              </div>
            )}
          </Show>
        </div>
        <Show when={props.controller}>{(controller) => controller()}</Show>
      </div>
      {props.children}
    </div>
  );
};
