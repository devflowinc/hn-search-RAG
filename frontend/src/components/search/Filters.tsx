/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaSolidChevronDown } from "solid-icons/fa";
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Setter,
  Show,
} from "solid-js";
import { SetStoreFunction } from "solid-js/store";
import { SearchOptions } from "../../types";
import DatePicker, { PickerValue } from "@rnwonder/solid-date-picker";
import "@rnwonder/solid-date-picker/dist/style.css";
import { AiOutlineInfoCircle } from "solid-icons/ai";
import { TrieveTooltip } from "../TrieveTooltip";

export interface FiltersProps {
  selectedStoryType: Accessor<string>;
  setSelectedStoryType: Setter<string>;
  sortBy: Accessor<string>;
  setSortBy: Setter<string>;
  dateRange: Accessor<string>;
  setDateRange: Setter<string>;
  searchType: Accessor<string>;
  setSearchType: Setter<string>;
  latency: Accessor<number | null>;
  setSearchOptions: SetStoreFunction<SearchOptions>;
  searchOptions: SearchOptions;
  setMatchAnyAuthorNames: Setter<string[]>;
  setMatchNoneAuthorNames: Setter<string[]>;
  matchAnyAuthorNames: Accessor<string[]>;
  matchNoneAuthorNames: Accessor<string[]>;
  setPopularityFilters: Setter<any>;
  popularityFilters: Accessor<any>;
}

export default function Filters(props: FiltersProps) {
  const [openAuthorFilterModal, setOpenAuthorFilterModal] = createSignal(false);
  const [openPopularityFilterModal, setOpenPopularityFilterModal] =
    createSignal(false);
  const [openAdvancedOptions, setOpenAdvancedOptions] = createSignal(false);
  const [rangeDate, setRangeDate] = createSignal<PickerValue>({
    label: "",
    value: {},
  });
  const [currentAnyAuthor, setCurrentAnyAuthor] = createSignal("");
  const [currentNoneAuthor, setCurrentNoneAuthor] = createSignal("");

  onMount(() => {
    if (props.dateRange().startsWith("{")) {
      const date_range = JSON.parse(props.dateRange());
      setRangeDate({
        label: "Custom Range",
        value: {
          start: date_range.gt
            ? new Date(date_range.gt).toISOString()
            : undefined,
          end: date_range.lt
            ? new Date(date_range.lt).toISOString()
            : undefined,
        },
      });
    }
  });

  createEffect(() => {
    const onEnterCallback = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        if (document.activeElement?.id === "matchAnyAuthors") {
          const curAnyAuthor = currentAnyAuthor();
          if (!curAnyAuthor) return;

          props.setMatchAnyAuthorNames((prev) => [
            ...prev.filter((a) => a !== curAnyAuthor),
            curAnyAuthor,
          ]);
          setCurrentAnyAuthor("");
        } else if (document.activeElement?.id === "matchNoneAuthorNames") {
          const curNoneAuthor = currentNoneAuthor();
          if (!curNoneAuthor) return;

          props.setMatchNoneAuthorNames((prev) => [
            ...prev.filter((a) => a !== curNoneAuthor),
            curNoneAuthor,
          ]);
          setCurrentNoneAuthor("");
        }
      }
    };
    window.addEventListener("keydown", onEnterCallback);

    onCleanup(() => {
      window.removeEventListener("keydown", onEnterCallback);
    });
  });

  createEffect(() => {
    if (!props.dateRange().startsWith("{")) {
      setRangeDate({
        label: "",
        value: {},
      });
    }
  });

  createEffect(() => {
    if (rangeDate().value.start || rangeDate().value.end) {
      props.setDateRange(
        JSON.stringify({
          gt:
            rangeDate().value.start != ""
              ? rangeDate().value.start?.toString()
              : undefined,
          lt:
            rangeDate().value.end != ""
              ? rangeDate().value.end?.toString()
              : undefined,
        }),
      );
    }
  });

  const combinedAuthorFiltersLength = createMemo(() => {
    return (
      props.matchAnyAuthorNames().length + props.matchNoneAuthorNames().length
    );
  });

  const getTooltipText = () => {
    if (props.searchType() === "fulltext") {
      return "Fulltext is powered by SPLADE sparse vectors and is the recommended search method for most queries. It automatically handles typos and synonyms.";
    }

    if (props.searchType() === "semantic") {
      return "Semantic mode is powered by dense vectors and is the recommended search method for queries that are more about the meaning of the text than the exact words used. ";
    }

    if (props.searchType() === "hybrid") {
      return "Hybrid search performs both a fulltext and semantic search then ranks the results with a cross-encoder (bge-large-en re-reranker) to merge them. ";
    }

    if (props.searchType() === "bm25") {
      return "BM25 search matches search terms between the query and data objects in the index and ranks results based on the frequency of those terms.";
    }

    if (props.searchType() === "autocomplete") {
      return "Autocomplete is???";
    }

    return null;
  };

  return (
    <div class="flex items-center gap-2 p-2">
      <div class="flex flex-wrap items-center gap-2 text-black">
        <span>Search</span>
        <div>
          <label for="stories" class="sr-only">
            Stories
          </label>
          <select
            id="stories"
            class="form-select w-fit border border-stone-300 bg-hn p-1 text-zinc-600"
            onChange={(e) => props.setSelectedStoryType(e.currentTarget.value)}
            value={props.selectedStoryType()}
          >
            <option value="all">All</option>
            <option selected value="story">
              Stories
            </option>
            <option value="comment">Comments</option>
            <option value="ask">Ask HN</option>
            <option value="show">Show HN</option>
            <option value="job">Jobs</option>
            <option value="poll">Polls</option>
          </select>
        </div>
        <span>by</span>
        <div>
          <label for="popularity" class="sr-only">
            Popularity
          </label>
          <select
            id="popularity"
            class="form-select border border-stone-300 bg-hn p-1 text-zinc-600"
            onChange={(e) => props.setSortBy(e.currentTarget.value)}
            value={props.sortBy()}
          >
            <option>Relevance</option>
            <option>Popularity</option>
            <option>Date</option>
          </select>
        </div>
        <span>for</span>
        <div class="flex-col">
          <label for="date-range" class="sr-only">
            Date Range
          </label>
          <DatePicker
            hideTopArea
            calendarJSX={() => {
              return (
                <div class="flex flex-col gap-2 p-2">
                  <span>From:</span>
                  <input
                    class="form-input border border-stone-300 bg-hn p-1 text-zinc-600"
                    type="date"
                    value={rangeDate().value.start?.replace(
                      "T00:00:00.000Z",
                      "",
                    )}
                    onInput={(e) => {
                      setRangeDate({
                        ...rangeDate(),
                        value: {
                          ...rangeDate().value,
                          start: e.currentTarget.value,
                        },
                      });
                    }}
                  />
                  <span>To:</span>
                  <input
                    class="form-input border border-stone-300 bg-hn p-1 text-zinc-600"
                    type="date"
                    value={rangeDate().value.end?.replace("T00:00:00.000Z", "")}
                    onInput={(e) => {
                      setRangeDate({
                        ...rangeDate(),
                        value: {
                          ...rangeDate().value,
                          end: e.currentTarget.value,
                        },
                      });
                    }}
                  />
                </div>
              );
            }}
            value={rangeDate}
            setValue={setRangeDate}
            renderInput={({ showDate }) => (
              <select
                id="date-range"
                class="form-select border border-stone-300 bg-hn p-1 text-zinc-600"
                onClick={(e) => {
                  e.preventDefault();
                  if (e.currentTarget.value === "custom") {
                    showDate();
                  } else {
                    props.setDateRange(e.currentTarget.value);
                  }
                }}
                value={
                  props.dateRange().startsWith("{")
                    ? "custom"
                    : props.dateRange()
                }
              >
                <option value="all">All Time</option>
                <option value="last24h">Last 24h</option>
                <option value="pastWeek">Past Week</option>
                <option value="pastMonth">Past Month</option>
                <option value="pastYear">Past Year</option>
                <option value="custom">
                  {rangeDate().value.start || rangeDate().value.end
                    ? (!rangeDate().value.end ? "After " : "") +
                      (rangeDate().value.start
                        ? rangeDate().value.start?.replace("T00:00:00.000Z", "")
                        : "") +
                      (rangeDate().value.start && rangeDate().value.end
                        ? " - "
                        : "") +
                      (!rangeDate().value.start ? "Before " : "") +
                      (rangeDate().value.end
                        ? rangeDate().value.end?.replace("T00:00:00.000Z", "")
                        : "")
                    : "Custom"}
                </option>
              </select>
            )}
            type="range"
          />
        </div>
        <span>using</span>
        <div class="flex items-center gap-1">
          <select
            id="stories"
            class="form-select w-fit border border-stone-300 bg-hn p-1 text-zinc-600"
            onChange={(e) => {
              props.setSearchType(e.currentTarget.value);
              props.setSearchOptions("rerankType", undefined);
            }}
            value={props.searchType()}
          >
            <option selected value={"hybrid"}>
              Hybrid
            </option>
            <option value="semantic">Semantic</option>
            <option value="fulltext">Fulltext</option>
            <option value="bm25">BM25</option>
            <option value="autocomplete">Autocomplete</option>
          </select>
          <Show when={getTooltipText()}>
            {(tooltipText) => (
              <TrieveTooltip
                direction="right"
                body={<AiOutlineInfoCircle class="h-4 w-4" />}
                tooltipText={tooltipText()}
              />
            )}
          </Show>
        </div>
        <div class="relative">
          <div class="flex items-center gap-1">
            <div
              classList={{
                "rounded-full w-3 h-3 text-[8px] text-center leading-[10px] pt-[1px]":
                  true,
                "bg-[#ff6600] text-white": combinedAuthorFiltersLength() > 0,
                "bg-stone-200 text-neutral-500":
                  combinedAuthorFiltersLength() === 0,
              }}
            >
              {combinedAuthorFiltersLength()}
            </div>
            <button
              onClick={() => setOpenAuthorFilterModal((prev) => !prev)}
              class="form-select flex w-fit items-center gap-1 bg-hn text-xs"
            >
              Author Filters
              <FaSolidChevronDown size={10} />
            </button>
          </div>

          <Show when={openAuthorFilterModal()}>
            <div
              class="z-5 fixed left-0 top-1 min-h-screen w-full"
              onClick={() => setOpenAuthorFilterModal(false)}
            />
            <div class="absolute right-0 top-[1.85rem] z-10 flex flex-col gap-2 border border-stone-300 bg-hn p-2">
              <label for="matchAnyAuthors">Any of the following authors:</label>
              <div class="flex items-center gap-2 border border-stone-300 bg-hn px-1 py-0.5 focus:border-black">
                <input
                  id="matchAnyAuthors"
                  class="form-input border-none bg-transparent text-zinc-600 focus:border-none focus:outline-none focus:ring-0"
                  type="text"
                  placeholder="Author Name"
                  value={currentAnyAuthor()}
                  onInput={(e) => setCurrentAnyAuthor(e.currentTarget.value)}
                  onFocus={(e) => {
                    e.currentTarget.parentElement!.style.border =
                      "1px solid black";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.border =
                      "1px solid #d2d6dc";
                  }}
                />
                <button
                  class="rounded-full border border-stone-300 bg-hn px-2 py-0.5 hover:border-black"
                  onClick={() => {
                    const curAnyAuthor = currentAnyAuthor();
                    if (!curAnyAuthor) return;
                    props.setMatchAnyAuthorNames((prev) => [
                      ...prev.filter((a) => a !== curAnyAuthor),
                      curAnyAuthor,
                    ]);
                    setCurrentAnyAuthor("");
                  }}
                >
                  +
                </button>
              </div>
              <For each={props.matchAnyAuthorNames()}>
                {(author) => (
                  <div class="flex items-center gap-2">
                    <p>{author}</p>
                    <button
                      class="rounded-full border border-stone-300 bg-hn px-2 py-0.5 hover:border-black"
                      onClick={() => {
                        props.setMatchAnyAuthorNames((prev) =>
                          prev.filter((a) => a !== author),
                        );
                      }}
                    >
                      -
                    </button>
                  </div>
                )}
              </For>
              <div class="h-0.5 bg-stone-300" />
              <label for="matchNoneAuthorNames">
                None of the following authors:
              </label>
              <div class="flex items-center gap-2 border border-stone-300 bg-hn px-1 py-0.5 focus:border-black">
                <input
                  id="matchNoneAuthorNames"
                  class="form-input border-none bg-transparent text-zinc-600 focus:border-none focus:outline-none focus:ring-0"
                  type="text"
                  placeholder="Author Name"
                  value={currentNoneAuthor()}
                  onInput={(e) => setCurrentNoneAuthor(e.currentTarget.value)}
                  onFocus={(e) => {
                    e.currentTarget.parentElement!.style.border =
                      "1px solid black";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.parentElement!.style.border =
                      "1px solid #d2d6dc";
                  }}
                />
                <button
                  class="rounded-full border border-stone-300 bg-hn px-2 py-0.5 hover:border-black"
                  onClick={() => {
                    const curNoneAuthor = currentNoneAuthor();
                    if (!curNoneAuthor) return;
                    props.setMatchNoneAuthorNames((prev) => [
                      ...prev.filter((a) => a !== curNoneAuthor),
                      curNoneAuthor,
                    ]);
                    setCurrentNoneAuthor("");
                  }}
                >
                  +
                </button>
              </div>
              <For each={props.matchNoneAuthorNames()}>
                {(author) => (
                  <div class="flex items-center gap-2">
                    <p>{author}</p>
                    <button
                      class="rounded-full border border-stone-300 bg-hn px-2 py-[1px] hover:border-black"
                      onClick={() => {
                        props.setMatchNoneAuthorNames((prev) =>
                          prev.filter((a) => a !== author),
                        );
                      }}
                    >
                      -
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
        <div class="relative">
          <div class="flex items-center gap-1">
            <div
              classList={{
                "rounded-full w-3 h-3 text-[8px] text-center leading-[10px] pt-[1px]":
                  true,
                "bg-[#ff6600] text-white":
                  Object.keys(props.popularityFilters()).length > 0,
                "bg-stone-200 text-neutral-500":
                  Object.keys(props.popularityFilters()).length === 0,
              }}
            >
              {Object.keys(props.popularityFilters()).length}
            </div>
            <button
              onClick={() => setOpenPopularityFilterModal((prev) => !prev)}
              class="form-select flex w-fit items-center gap-1 bg-hn text-xs"
            >
              Other Filters
              <FaSolidChevronDown size={10} />
            </button>
          </div>
          <Show when={openPopularityFilterModal()}>
            <div
              class="z-5 fixed left-0 top-1 min-h-screen w-full"
              onClick={() => setOpenPopularityFilterModal(false)}
            />
            <div class="absolute right-0 top-[1.85rem] z-10 flex min-w-[100px] flex-col gap-2 border border-stone-300 bg-hn p-2">
              <label for="gtPoints">&gt; points:</label>
              <input
                id="gtPoints"
                class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                type="number"
                step="any"
                placeholder="0"
                value={props.popularityFilters()["num_value"]?.gt}
                onChange={(e) => {
                  props.setPopularityFilters({
                    ...props.popularityFilters(),
                    num_value: {
                      ...props.popularityFilters()["num_value"],
                      gt: e.target.valueAsNumber,
                    },
                  });
                }}
              />
              <label for="lePoints">&lt; points:</label>
              <input
                id="lePoints"
                class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                type="number"
                step="any"
                placeholder="0"
                value={props.popularityFilters()["num_value"]?.lt}
                onChange={(e) => {
                  props.setPopularityFilters({
                    ...props.popularityFilters(),
                    num_value: {
                      ...props.popularityFilters()["num_value"],
                      lt: e.target.valueAsNumber,
                    },
                  });
                }}
              />
              <div class="h-0.5 bg-stone-300" />
              <label for="gtComments">&gt; descendants:</label>
              <input
                id="gtComments"
                class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                type="number"
                step="any"
                placeholder="0"
                value={props.popularityFilters()["num_comments"]?.gt}
                onChange={(e) => {
                  props.setPopularityFilters({
                    ...props.popularityFilters(),
                    num_comments: {
                      ...props.popularityFilters()["num_comments"],
                      gt: e.target.valueAsNumber,
                    },
                  });
                }}
              />
              <label for="leComments">&lt; descendants:</label>
              <input
                id="leComments"
                class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                type="number"
                step="any"
                placeholder="0"
                value={props.popularityFilters()["num_comments"]?.lt}
                onChange={(e) => {
                  props.setPopularityFilters({
                    ...props.popularityFilters(),
                    num_comments: {
                      ...props.popularityFilters()["num_comments"],
                      lt: e.target.valueAsNumber,
                    },
                  });
                }}
              />
              <div class="h-0.5 bg-stone-300" />
              <label for="hasID">has id:</label>
              <input
                id="hasID"
                class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                type="text"
                placeholder="ID"
                value={props.popularityFilters()["storyID"] ?? ""}
                onChange={(e) => {
                  props.setPopularityFilters({
                    ...props.popularityFilters(),
                    storyID: e.target.value,
                  });
                }}
              />
            </div>
          </Show>
        </div>
        <div class="relative">
          <button
            onClick={() => setOpenAdvancedOptions((prev) => !prev)}
            class="form-select flex w-fit items-center gap-1 bg-hn text-xs"
          >
            Advanced
            <FaSolidChevronDown size={10} />
          </button>
          <Show when={openAdvancedOptions()}>
            <div
              class="z-5 fixed left-0 top-1 min-h-screen w-full"
              onClick={() => setOpenAdvancedOptions(false)}
            />
            <div class="absolute right-0 top-[1.85rem] z-10 flex flex-col gap-2 border border-stone-300 bg-hn p-2">
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Score Threshold (0.0 to 1.0):</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.scoreThreshold ?? 0}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "scoreThreshold",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Prefetch Amount:</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="1"
                  value={props.searchOptions.prefetchAmount ?? 0}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "prefetchAmount",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Rerank type:</label>
                <select
                  class="rounded border border-neutral-400 bg-white p-1 text-black"
                  onChange={(e) => {
                    const newType = e.currentTarget.value;
                    props.setSearchOptions(
                      "rerankType",
                      newType === "none" ? undefined : newType,
                    );
                  }}
                  value={props.searchOptions.rerankType ?? "none"}
                >
                  <option>None</option>
                  <option>Semantic</option>
                  <option>Full Text</option>
                </select>
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Page size</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.pageSize}
                  onChange={(e) => {
                    props.setSearchOptions("pageSize", e.target.valueAsNumber);
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Highlight Delimiters (seperated by ',')</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="text"
                  step="any"
                  value={props.searchOptions.highlightDelimiters.join(",")}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightDelimiters",
                      e.target.value.split(","),
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Highlight Threshold</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightThreshold}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightThreshold",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Highlight Max Length</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightMaxLength}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightMaxLength",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Highlight Max Number</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightMaxNum}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightMaxNum",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Highlight Results (Latency Penalty)</label>
                <input
                  class="h-4 w-4"
                  type="checkbox"
                  checked={props.searchOptions.highlightResults}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightResults",
                      e.target.checked,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Use Quote Negated Terms (Latency Penalty)</label>
                <input
                  class="h-4 w-4"
                  type="checkbox"
                  checked={props.searchOptions.useQuoteNegatedTerms}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "useQuoteNegatedTerms",
                      e.target.checked,
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 whitespace-nowrap p-1">
                <label>Recency bias (0.0) to (1.0)</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.recencyBias}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "recencyBias",
                      e.target.valueAsNumber,
                    );
                  }}
                />
              </div>
            </div>
          </Show>
        </div>
        <Show when={props.latency() !== null}>
          <p>({props.latency()}s)</p>
        </Show>
      </div>
    </div>
  );
}
