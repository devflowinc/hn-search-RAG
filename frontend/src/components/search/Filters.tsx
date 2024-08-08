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
          start: new Date(date_range.gt).toISOString(),
          end: new Date(date_range.lt).toISOString(),
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
    if (rangeDate().value.start) {
      props.setDateRange(
        JSON.stringify({
          gt: rangeDate().value.start?.toString(),
          lt: rangeDate().value.end?.toString(),
        })
      );
    }
  });

  const combinedAuthorFiltersLength = createMemo(() => {
    return (
      props.matchAnyAuthorNames().length + props.matchNoneAuthorNames().length
    );
  });

  return (
    <div class="p-2 flex items-center gap-2">
      <div class="flex flex-wrap gap-2 text-black items-center">
        <span>Search</span>
        <div>
          <label for="stories" class="sr-only">
            Stories
          </label>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 w-fit bg-hn"
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
            class="form-select text-zinc-600 p-1 border border-stone-300 bg-hn"
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
            value={rangeDate}
            setValue={setRangeDate}
            renderInput={({ showDate }) => (
              <select
                id="date-range"
                class="form-select text-zinc-600 p-1 border border-stone-300 bg-hn"
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
                  {rangeDate().value.start
                    ? rangeDate().value.start?.replace("T07:00:00.000Z", "") +
                      " - " +
                      rangeDate().value.end?.replace("T07:00:00.000Z", "")
                    : "Custom"}
                </option>
              </select>
            )}
            type="range"
          />
        </div>
        <span>using</span>
        <div>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 w-fit bg-hn"
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
              class="form-select text-xs w-fit bg-hn flex items-center gap-1"
            >
              Author Filters
              <FaSolidChevronDown size={10} />
            </button>
          </div>

          <Show when={openAuthorFilterModal()}>
            <div
              class="fixed top-1 left-0 min-h-screen w-full z-5"
              onClick={() => setOpenAuthorFilterModal(false)}
            />
            <div class="absolute bg-hn flex flex-col gap-2 border border-stone-300 top-[1.85rem] p-2 z-10 right-0">
              <label for="matchAnyAuthors">Any of the following authors:</label>
              <div class="flex items-center gap-2 border border-stone-300 px-1 py-0.5 bg-hn focus:border-black">
                <input
                  id="matchAnyAuthors"
                  class="form-input text-zinc-600 border-none focus:border-none focus:ring-0 bg-transparent focus:outline-none"
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
                  class="bg-hn py-0.5 px-2 border border-stone-300 rounded-full hover:border-black"
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
                      class="bg-hn py-0.5 px-2 border border-stone-300 rounded-full hover:border-black"
                      onClick={() => {
                        props.setMatchAnyAuthorNames((prev) =>
                          prev.filter((a) => a !== author)
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
              <div class="flex items-center gap-2 border border-stone-300 px-1 py-0.5 bg-hn focus:border-black">
                <input
                  id="matchNoneAuthorNames"
                  class="form-input text-zinc-600 border-none focus:border-none focus:ring-0 bg-transparent focus:outline-none"
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
                  class="bg-hn py-0.5 px-2 border border-stone-300 rounded-full hover:border-black"
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
                      class="bg-hn py-[1px] px-2 border border-stone-300 rounded-full hover:border-black"
                      onClick={() => {
                        props.setMatchNoneAuthorNames((prev) =>
                          prev.filter((a) => a !== author)
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
              class="form-select text-xs w-fit bg-hn flex items-center gap-1"
            >
              Popularity Filters
              <FaSolidChevronDown size={10} />
            </button>
          </div>
          <Show when={openPopularityFilterModal()}>
            <div
              class="fixed top-1 left-0 min-h-screen w-full z-5"
              onClick={() => setOpenPopularityFilterModal(false)}
            />
            <div class="absolute bg-hn flex flex-col gap-2 border border-stone-300 top-[1.85rem] p-2 z-10 right-0 min-w-[100px]">
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
            class="form-select text-xs w-fit bg-hn flex items-center gap-1"
          >
            Advanced
            <FaSolidChevronDown size={10} />
          </button>
          <Show when={openAdvancedOptions()}>
            <div
              class="fixed top-1 left-0 min-h-screen w-full z-5"
              onClick={() => setOpenAdvancedOptions(false)}
            />
            <div class="absolute bg-hn flex flex-col gap-2 border border-stone-300 top-[1.85rem] p-2 z-10 right-0">
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Score Threshold (0.0 to 1.0):</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.scoreThreshold ?? 0}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "scoreThreshold",
                      e.target.valueAsNumber
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Prefetch Amount:</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="1"
                  value={props.searchOptions.prefetchAmount ?? 0}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "prefetchAmount",
                      e.target.valueAsNumber
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Rerank type:</label>
                <select
                  class="rounded border border-neutral-400 p-1 bg-white text-black"
                  onChange={(e) => {
                    const newType = e.currentTarget.value;
                    props.setSearchOptions(
                      "rerankType",
                      newType === "none" ? undefined : newType
                    );
                  }}
                  value={props.searchOptions.rerankType ?? "none"}
                >
                  <option>None</option>
                  <option>Semantic</option>
                  <option>Full Text</option>
                </select>
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
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
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Highlight Delimiters (seperated by ',')</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="text"
                  step="any"
                  value={props.searchOptions.highlightDelimiters.join(",")}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightDelimiters",
                      e.target.value.split(",")
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Highlight Threshold</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightThreshold}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightThreshold",
                      e.target.valueAsNumber
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Highlight Max Length</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightMaxLength}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightMaxLength",
                      e.target.valueAsNumber
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Highlight Max Number</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.highlightMaxNum}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightMaxNum",
                      e.target.valueAsNumber
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Highlight Results (Latency Penalty)</label>
                <input
                  class="h-4 w-4"
                  type="checkbox"
                  checked={props.searchOptions.highlightResults}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "highlightResults",
                      e.target.checked
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Use Quote Negated Terms (Latency Penalty)</label>
                <input
                  class="h-4 w-4"
                  type="checkbox"
                  checked={props.searchOptions.useQuoteNegatedTerms}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "useQuoteNegatedTerms",
                      e.target.checked
                    );
                  }}
                />
              </div>
              <div class="flex items-center justify-between space-x-2 p-1 whitespace-nowrap">
                <label>Recency bias (0.0) to (1.0)</label>
                <input
                  class="w-16 rounded border border-neutral-400 p-0.5 text-black"
                  type="number"
                  step="any"
                  value={props.searchOptions.recencyBias}
                  onChange={(e) => {
                    props.setSearchOptions(
                      "recencyBias",
                      e.target.valueAsNumber
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
