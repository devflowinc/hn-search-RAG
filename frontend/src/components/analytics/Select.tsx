import { For, JSX, Show } from "solid-js";
import { DateRangeOption } from "../../types";

interface SelectProps {
  options: DateRangeOption[];
  display: (option: DateRangeOption) => string;
  selected: DateRangeOption;
  onSelected: (option: string) => void;
  class?: string;
  label?: JSX.Element;
  id?: string;
}

export const Select = (props: SelectProps) => {
  return (
    <>
      <Show when={props.label}>{(label) => label()}</Show>
      <select
        class={`bg-neutral-200/70 min-w-[100px] relative border rounded border-neutral-300 ${props.class}`}
        value={props.selected.label}
        onChange={(e) => props.onSelected(e.target.value)}
      >
        <option value="" disabled hidden>
          Select an option
        </option>
        <For each={props.options}>
          {(option): JSX.Element => (
            <option value={option.label}>{props.display(option)}</option>
          )}
        </For>
      </select>
    </>
  );
};
