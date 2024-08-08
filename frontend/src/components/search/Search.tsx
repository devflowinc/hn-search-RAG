import { FiExternalLink } from "solid-icons/fi";
import { HiSolidMagnifyingGlass } from "solid-icons/hi";
import { Accessor, Setter, Show } from "solid-js";

export interface SearchProps {
  query: Accessor<string>;
  setQuery: Setter<string>;
  setMatchAnyAuthorNames: Setter<string[]>;
  setMatchNoneAuthorNames: Setter<string[]>;
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
          onInput={(e) => {
            const byNegatedMatches =
              (e.currentTarget.value.match(/by:-\w+/g) as string[]) ?? [];
            const byNonNegatedMatches =
              (e.currentTarget.value.match(/by:\w+/g) as string[]) ?? [];
            const authorNegatedMatches =
              (e.currentTarget.value.match(/author:-\w+/g) as string[]) ?? [];
            const authorNonNegatedMatches =
              (e.currentTarget.value.match(/author:\w+/g) as string[]) ?? [];

            const negatedMatches = [
              ...new Set(
                [...byNegatedMatches, ...authorNegatedMatches].map((a) =>
                  a
                    .replace("author:-", "")
                    .replace("by:-", "")
                    .replace("author:", "")
                    .replace("by:", "")
                    .trim()
                )
              ),
            ];
            const nonNegatedMatches = [
              ...new Set(
                [...byNonNegatedMatches, ...authorNonNegatedMatches].map((a) =>
                  a
                    .replace("author:-", "")
                    .replace("by:-", "")
                    .replace("author:", "")
                    .replace("by:", "")
                    .trim()
                )
              ),
            ];

            if (nonNegatedMatches.length > 0) {
              props.setMatchAnyAuthorNames(nonNegatedMatches);
            }

            if (negatedMatches.length > 0) {
              props.setMatchNoneAuthorNames(negatedMatches);
            }

            props.setQuery(e.currentTarget.value);
          }}
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
