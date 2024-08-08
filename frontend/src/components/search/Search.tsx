import { FiExternalLink } from "solid-icons/fi";
import { HiSolidMagnifyingGlass } from "solid-icons/hi";
import { Accessor, Setter, Show } from "solid-js";

export interface SearchProps {
  query: Accessor<string>;
  setQuery: Setter<string>;
  algoliaLink: Accessor<string>;
  setOpenRateQueryModal: Setter<boolean>;
}

export const Search = (props: SearchProps) => {
  return (
    <div class="mb-4 flex flex-col gap-y-1 sm:mb-1">
      <div class="mx-2 flex items-center justify-center rounded-md border border-stone-300 p-2 focus-within:border-stone-500 active:border-stone-500">
        <HiSolidMagnifyingGlass class="h-5 w-5 text-gray-500" />
        <input
          type="text"
          class="ml-2 w-full bg-transparent focus:outline-none active:outline-none"
          placeholder="Search"
          value={props.query()}
          onInput={(e) => {
            props.setQuery(e.currentTarget.value);
          }}
        />
      </div>

      <div class="mx-2 flex flex-wrap items-center justify-end gap-x-2">
        <Show when={props.query()}>
          <button
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => props.setOpenRateQueryModal(true)}
          >
            Rate Query
          </button>
        </Show>
        <a
          href={props.algoliaLink()}
          class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
          target="_blank"
        >
          Try With Algolia <FiExternalLink class="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};
