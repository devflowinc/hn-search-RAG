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
    <div class="mb-4 sm:mb-1 gap-y-1 flex flex-col">
      <div class="flex justify-center items-center mx-2 p-2 rounded-md border border-stone-300 active:border-stone-500 focus-within:border-stone-500">
        <HiSolidMagnifyingGlass class="text-gray-500 w-5 h-5" />
        <input
          type="text"
          class="w-full bg-transparent active:outline-none focus:outline-none ml-2"
          placeholder="Search"
          value={props.query()}
          onInput={(e) => props.setQuery(e.currentTarget.value)}
        />
      </div>

      <div class="flex justify-end items-center mx-2 gap-x-2 flex-wrap">
        <Show when={props.query()}>
          <button
            class="text-zinc-600 p-1 border border-stone-300 w-fit bg-hn flex items-center gap-x-1 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => props.setOpenRateQueryModal(true)}
          >
            Rate Query
          </button>
        </Show>
        <a
          href={props.algoliaLink()}
          class="text-zinc-600 p-1 border border-stone-300 w-fit bg-hn flex items-center gap-x-1 hover:border-stone-900 hover:text-zinc-900"
          target="_blank"
        >
          Try With Algolia <FiExternalLink class="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
