import { FiExternalLink, FiRefreshCw } from "solid-icons/fi";
import {
  HiOutlineAdjustmentsVertical,
  HiSolidMagnifyingGlass,
} from "solid-icons/hi";
import { Accessor, createSignal, For, onMount, Setter, Show } from "solid-js";
import {
  AdvancedSearchSyntax,
  HowToUse,
  WhyMakeThis,
} from "../../pages/AboutPage";
import { FullScreenModal } from "../FullScreenModal";
import { createToast } from "../ShowToast";
import { VsClose } from "solid-icons/vs";

export interface SearchProps {
  query: Accessor<string>;
  setQuery: Setter<string>;
  suggestedQueries: Accessor<string[]>;
  loadingSuggestedQueries: Accessor<boolean>;
  getSuggestedQueries: () => void;
  algoliaLink: Accessor<string>;
  setOpenRateQueryModal: Setter<boolean>;
  aiEnabled: Accessor<boolean>;
  setLoadingAi: Setter<boolean>;
  setAiEnabled: Setter<boolean>;
  aiSummaryPrompt: Accessor<string>;
  setAiSummaryPrompt: Setter<string>;
  aiMaxTokens: Accessor<number>;
  setAiMaxTokens: Setter<number>;
  aiFrequencyPenalty: Accessor<number>;
  setAiFrequencyPenalty: Setter<number>;
  aiPresencePenalty: Accessor<number>;
  setAiPresencePenalty: Setter<number>;
  aiTemperature: Accessor<number>;
  setAiTemperature: Setter<number>;
  suggestionContext: Accessor<string>;
  setSuggestionContext: Setter<string>;
}

export interface AiParams {
  aiSummaryPrompt: string;
  aiMaxTokens: number;
  aiFrequencyPenalty: number;
  aiPresencePenalty: number;
  aiTemperature: number;
  suggestionContext: string;
}

export const Search = (props: SearchProps) => {
  const [openWhyMakeThisModal, setOpenWhyMakeThisModal] = createSignal(false);
  const [openHelpModal, setOpenHelpModal] = createSignal(false);
  const [openAiSettingsModal, setOpenAiSettingsModal] = createSignal(false);
  const [tempAiParams, setTempAiParams] = createSignal<AiParams>({
    aiSummaryPrompt: "",
    aiMaxTokens: 0,
    aiFrequencyPenalty: 0,
    aiPresencePenalty: 0,
    aiTemperature: 0,
    suggestionContext: "",
  });

  onMount(() => {
    setTempAiParams({
      aiSummaryPrompt: props.aiSummaryPrompt(),
      aiMaxTokens: props.aiMaxTokens(),
      aiFrequencyPenalty: props.aiFrequencyPenalty(),
      aiPresencePenalty: props.aiPresencePenalty(),
      aiTemperature: props.aiTemperature(),
      suggestionContext: "",
    });
  });

  return (
    <>
      <div class="mb-5 flex flex-col gap-y-1">
        <div class="mx-2 flex items-center justify-center rounded-md border border-stone-300 p-2 focus-within:border-stone-500 active:border-stone-500">
          <HiSolidMagnifyingGlass class="h-5 w-5 text-gray-500" />
          <input
            type="text"
            id="primary-search-input"
            class="ml-2 w-full bg-transparent focus:outline-none active:outline-none"
            placeholder="ctrl + k to focus | click help for info on search modes + filter syntax"
            value={props.query()}
            onInput={(e) => {
              props.setQuery(e.currentTarget.value);
            }}
          />
          <Show when={props.query()}>
            <button onClick={() => props.setQuery("")}>
              <VsClose class="h-4 w-4 self-end text-gray-500" />
            </button>
          </Show>
        </div>
        <div class="mx-2 flex flex-wrap items-center justify-end gap-2">
          <div class="flex items-center space-x-2">
            <p class="text-sm text-zinc-600">AI Features</p>
            <button
              type="button"
              class="focus:ring-none group relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full outline-[#ff6600]"
              role="switch"
              aria-checked="false"
              onClick={() => {
                if (props.aiEnabled()) {
                  props.setAiEnabled(false);
                } else {
                  props.setAiEnabled(true);
                  if (props.query()) {
                    props.setLoadingAi(true);
                  }
                }
              }}
            >
              <span class="sr-only">Get AI Summary</span>
              <span
                aria-hidden="true"
                class="pointer-events-none absolute h-full w-full rounded-md bg-none"
              />
              <span
                aria-hidden="true"
                classList={{
                  "pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out":
                    true,
                  "bg-stone-300": !props.aiEnabled(),
                  "bg-[#ff6600]": props.aiEnabled(),
                }}
              />
              <span
                aria-hidden="true"
                classList={{
                  "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out":
                    true,
                  "translate-x-5": props.aiEnabled(),
                  "translate-x-0": !props.aiEnabled(),
                }}
              />
            </button>
            <Show when={props.aiEnabled()}>
              <button
                class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
                onClick={() => setOpenAiSettingsModal(true)}
                title="AI Settings"
              >
                <HiOutlineAdjustmentsVertical class="h-4 w-4" />
              </button>
            </Show>
          </div>
          <div class="flex-1" />
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
            Rate Results
          </button>
          <button
            class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => setOpenHelpModal(true)}
          >
            Help
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
        <div class="mx-2 flex flex-wrap items-center gap-2">
          <button
            class="h-full border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
            onClick={() => props.getSuggestedQueries()}
            disabled={props.loadingSuggestedQueries()}
          >
            <FiRefreshCw class="h-3 w-3" />
          </button>
          <p class="py-[.2rem] text-sm text-zinc-600">Suggested queries: </p>
          <Show
            when={props.suggestedQueries().length > 0}
            fallback={
              <p class="animate-pulse text-sm text-stone-600">Loading...</p>
            }
          >
            <For each={props.suggestedQueries()}>
              {(suggestedQuery) => (
                <button
                  onClick={() => {
                    props.setQuery(suggestedQuery);
                  }}
                  classList={{
                    "border border-stone-300 px-1 py-0.5 text-neutral-600 hover:border-stone-600 hover:bg-[#FFFFF0]":
                      true,
                    "animate-pulse": props.loadingSuggestedQueries(),
                  }}
                >
                  {suggestedQuery}
                </button>
              )}
            </For>
          </Show>
        </div>
      </div>
      <FullScreenModal show={openHelpModal} setShow={setOpenHelpModal}>
        <div class="flex min-w-[250px] flex-col gap-y-4 sm:min-w-[300px] sm:max-w-[50vw]">
          <AdvancedSearchSyntax />
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
      <FullScreenModal
        show={openAiSettingsModal}
        setShow={setOpenAiSettingsModal}
      >
        <div class="min-w-[250px] sm:min-w-[400px] sm:max-w-[50vw]">
          <div class="flex flex-col gap-y-2">
            <div class="flex items-center gap-x-2 text-sm">
              <p>Model:</p>
              <p>gpt-4o</p>
            </div>
            <label aria-label="AI Summary Prompt" class="text-sm">
              LLM Prompt
            </label>
            <textarea
              class="h-[230px] w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().aiSummaryPrompt}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  aiSummaryPrompt: e.currentTarget.value,
                }))
              }
            />
            <label aria-label="AI Max Tokens" class="text-sm">
              Max Tokens
            </label>
            <input
              type="number"
              class="w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().aiMaxTokens}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  aiMaxTokens: parseInt(e.currentTarget.value),
                }))
              }
            />
            <label aria-label="AI Frequency Penalty" class="text-sm">
              Frequency Penalty
            </label>
            <input
              type="number"
              class="w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().aiFrequencyPenalty}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  aiFrequencyPenalty: parseFloat(e.currentTarget.value),
                }))
              }
            />
            <label aria-label="AI Presence Penalty" class="text-sm">
              Presence Penalty
            </label>
            <input
              type="number"
              class="w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().aiPresencePenalty}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  aiPresencePenalty: parseFloat(e.currentTarget.value),
                }))
              }
            />
            <label aria-label="AI Temperature" class="text-sm">
              Temperature
            </label>
            <input
              type="number"
              class="w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().aiTemperature}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  aiTemperature: parseFloat(e.currentTarget.value),
                }))
              }
            />
            <label aria-label="AI Temperature" class="text-sm">
              Query Suggestion Context
            </label>
            <input
              type="text"
              class="w-full border border-stone-300 bg-transparent p-1"
              value={tempAiParams().suggestionContext}
              onInput={(e) =>
                setTempAiParams((prev) => ({
                  ...prev,
                  suggestionContext: e.currentTarget.value,
                }))
              }
            />
          </div>
          <div class="mt-4 flex justify-end gap-x-2">
            <button
              class="border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
              onClick={() => setOpenAiSettingsModal(false)}
            >
              Cancel
            </button>
            <button
              class="border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
              onClick={() => {
                props.setAiSummaryPrompt(tempAiParams().aiSummaryPrompt);
                props.setAiMaxTokens(tempAiParams().aiMaxTokens);
                props.setAiFrequencyPenalty(tempAiParams().aiFrequencyPenalty);
                props.setAiPresencePenalty(tempAiParams().aiPresencePenalty);
                props.setAiTemperature(tempAiParams().aiTemperature);
                props.setSuggestionContext(tempAiParams().suggestionContext);
                setOpenAiSettingsModal(false);
              }}
            >
              Save
            </button>
          </div>
          <p class="pt-6 text-xs text-stone-600">
            See{" "}
            <a
              class="underline"
              href="https://docs.trieve.ai/api-reference/chunk/rag-on-specified-chunks"
            >
              docs for the RAG on Specified Chunks route
            </a>{" "}
            for more information on these parameters.
          </p>
        </div>
      </FullScreenModal>
    </>
  );
};
