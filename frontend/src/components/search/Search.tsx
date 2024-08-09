import { FiExternalLink } from "solid-icons/fi";
import { HiSolidMagnifyingGlass } from "solid-icons/hi";
import { Accessor, createSignal, Setter } from "solid-js";
import { HowToUse, WhyMakeThis } from "../../pages/AboutPage";
import { FullScreenModal } from "../FullScreenModal";
import { createToast } from "../ShowToast";

export interface SearchProps {
  query: Accessor<string>;
  setQuery: Setter<string>;
  algoliaLink: Accessor<string>;
  setOpenRateQueryModal: Setter<boolean>;
}

export const Search = (props: SearchProps) => {
  const [openWhyMakeThisModal, setOpenWhyMakeThisModal] = createSignal(false);
  const [openHowToUseModal, setOpenHowToUseModal] = createSignal(false);

  return (
    <>
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
        <div class="mx-2 flex flex-wrap items-center justify-end gap-2">
          <button
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => {
              const curQuery = props.query();
              if (!curQuery) {
                createToast({
                  message: "Please enter a query to rate.",
                  type: "error",
                });
                return;
              }

              props.setOpenRateQueryModal(true);
            }}
          >
            Rate Query
          </button>
          <button
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => setOpenHowToUseModal(true)}
          >
            How to Use?
          </button>
          <button
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => setOpenWhyMakeThisModal(true)}
          >
            Why Make This?
          </button>
          <a
            href={props.algoliaLink()}
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            target="_blank"
          >
            Try With Algolia <FiExternalLink class="h-4 w-4" />
          </a>
        </div>
      </div>
      <FullScreenModal show={openHowToUseModal} setShow={setOpenHowToUseModal}>
        <div class="min-w-[250px] sm:min-w-[300px] sm:max-w-[50vw]">
          <HowToUse />
          <p class="mt-6 text-xs text-gray-600">
            {" "}
            See more on the{" "}
            <a class="underline" href="/help">
              Help
            </a>{" "}
            page.{" "}
          </p>
        </div>
      </FullScreenModal>
      <FullScreenModal
        show={openWhyMakeThisModal}
        setShow={setOpenWhyMakeThisModal}
      >
        <div class="min-w-[250px] sm:min-w-[300px] sm:max-w-[50vw]">
          <WhyMakeThis />
          <p class="mt-6 text-xs text-gray-600">
            {" "}
            See more on the{" "}
            <a class="underline" href="/about">
              About
            </a>{" "}
            page.{" "}
          </p>
        </div>
      </FullScreenModal>
    </>
  );
};
