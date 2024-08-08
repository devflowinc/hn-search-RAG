import { For, JSX, Show } from "solid-js";

interface SelectProps {
  options: string[];
  selected: string;
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
        class={`relative min-w-[100px] rounded border border-neutral-300 bg-neutral-200/70 ${props.class}`}
        value={props.selected}
        onChange={(e) => props.onSelected(e.target.value)}
      >
        <option value="" disabled hidden>
          Select an option
        </option>
        <For each={props.options}>
          {(option): JSX.Element => <option value={option}>{option}</option>}
        </For>
      </select>
    </>
  );
};
