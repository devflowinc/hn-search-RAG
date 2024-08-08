import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import Filters from "../components/search/Filters";
import Header from "../components/Header";
import { Story } from "../components/search/Story";
import {
  ChunkMetadataStringTagSet,
  dateRangeSwitch,
  getFilters,
  SearchChunkQueryResponseBody,
  SearchOptions,
} from "../types";
import { PaginationController } from "../components/search/PaginationController";
import { Search } from "../components/search/Search";
import { Footer } from "../components/Footer";
import { createStore } from "solid-js/store";
import { FullScreenModal } from "../components/FullScreenModal";
import { createToast } from "../components/ShowToast";

const parseFloatOrNull = (val: string | null): number | null => {
  const num = parseFloat(val ?? "NaN");
  if (isNaN(num)) {
    return null;
  }
  return num;
};

const defaultScoreThreshold = (searchType: string): number => {
  switch (searchType) {
    case "semantic":
      return 0.5;
    case "hybrid":
      return 0.01;
    case "fulltext":
      return 5;
    default:
      return 0.3;
  }
};

export const SearchPage = () => {
  const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY as string;
  const trieveBaseURL = import.meta.env.VITE_TRIEVE_API_URL as string;
  const trieveDatasetId = import.meta.env.VITE_TRIEVE_DATASET_ID as string;
  const urlParams = new URLSearchParams(window.location.search);

  const defaultHighlightDelimiters = [" ", "-", "_", ".", ","];

  let abortController: AbortController | null = null;
  const [matchAnyAuthorNames, setMatchAnyAuthorNames] = createSignal(
    urlParams
      .get("matchAnyAuthorNames")
      ?.split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "") ?? [],
  );
  const [matchNoneAuthorNames, setMatchNoneAuthorNames] = createSignal(
    urlParams
      .get("matchNoneAuthorNames")
      ?.split(",")
      .map((name) => name.trim())
      .filter((name) => name !== "") ?? [],
  );
  const [popularityFilters, setPopularityFilters] = createSignal<any>(
    urlParams.get("popularityFilters")
      ? JSON.parse(urlParams.get("popularityFilters") as string)
      : {},
  );
  const [selectedStoryType, setSelectedStoryType] = createSignal(
    urlParams.get("storyType") ?? "story",
  );
  const [sortBy, setSortBy] = createSignal(
    urlParams.get("sortby") ?? "Relevance",
  );
  const [dateRange, setDateRange] = createSignal<string>(
    urlParams.get("dateRange") ?? "all",
  );
  const [stories, setStories] = createSignal<Story[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [searchType, setSearchType] = createSignal(
    urlParams.get("searchType") ?? "fulltext",
  );
  const [recommendType, setRecommendType] = createSignal("semantic");
  const [page, setPage] = createSignal(Number(urlParams.get("page") ?? "1"));
  const [algoliaLink, setAlgoliaLink] = createSignal("");
  const [latency, setLatency] = createSignal<number | null>(null);
  const [positiveRecStory, setPositiveRecStory] = createSignal<Story | null>(
    null,
  );
  const [recommendedStories, setRecommendedStories] = createSignal<Story[]>([]);
  const [showRecModal, setShowRecModal] = createSignal(false);
  const [searchID, setSearchID] = createSignal("");
  const [openRateQueryModal, setOpenRateQueryModal] = createSignal(false);
  const [rating, setRating] = createSignal({ rating: 5, note: "" });

  const [searchOptions, setSearchOptions] = createStore<SearchOptions>({
    prefetchAmount: parseInt(urlParams.get("prefetch_amount") ?? "30"),
    rerankType: urlParams.get("rerank_type") ?? undefined,
    scoreThreshold: parseFloatOrNull(urlParams.get("score_threshold")),
    pageSize: parseInt(urlParams.get("page_size") ?? "30"),
    highlightDelimiters:
      urlParams.get("highlight_delimiters")?.split(",") ??
      defaultHighlightDelimiters,
    highlightThreshold: parseFloat(
      urlParams.get("highlight_threshold") ?? "0.85",
    ),
    highlightMaxLength: parseInt(urlParams.get("highlight_max_length") ?? "50"),
    highlightMaxNum: parseInt(urlParams.get("highlight_max_num") ?? "50"),
    highlightWindow: parseInt(urlParams.get("highlight_window") ?? "0"),
    recencyBias: parseFloatOrNull(urlParams.get("recency_bias")) ?? 0,
    highlightResults: (urlParams.get("highlight_results") ?? "true") === "true",
    useQuoteNegatedTerms:
      (urlParams.get("use_quote_negated_terms") ?? "true") === "true",
  });

  const recommendDateRangeDisplay = createMemo(() => {
    const curDateRange = dateRange();
    if (curDateRange === "all") {
      return "all time";
    } else if (curDateRange === "last24h") {
      return "last 24 hours";
    } else if (curDateRange === "pastWeek") {
      return "past week";
    } else if (curDateRange === "pastMonth") {
      return "past month";
    } else if (curDateRange === "pastYear") {
      return "past year";
    } else {
      return "all time";
    }
  });

  const queryFiltersRemoved = createMemo(() => {
    return query()
      .replace(/author:-\w+/g, "")
      .replace(/author:\w+/g, "")
      .replace(/by:-\w+/g, "")
      .replace(/by:\w+/g, "")
      .replace(/story:\d+/g, "")
      .replace(/points>:\d+/g, "")
      .replace(/points<:\d+/g, "")
      .replace(/comments>:\d+/g, "")
      .replace(/comments<:\d+/g, "")
      .trimStart();
  });

  createEffect(() => {
    setSearchOptions("scoreThreshold", defaultScoreThreshold(searchType()));
  });

  createEffect(() => {
    setLoading(true);

    searchOptions.scoreThreshold &&
      urlParams.set(
        "score_threshold",
        searchOptions.scoreThreshold?.toString(),
      );

    urlParams.set("page_size", searchOptions.pageSize.toString());
    urlParams.set("prefetch_amount", searchOptions.prefetchAmount.toString());
    urlParams.set("rerank_type", searchOptions.rerankType ?? "none");
    urlParams.set(
      "highlight_delimiters",
      searchOptions.highlightDelimiters.join(","),
    );
    urlParams.set(
      "highlight_threshold",
      searchOptions.highlightThreshold.toString(),
    );
    urlParams.set(
      "highlight_max_length",
      searchOptions.highlightMaxLength.toString(),
    );
    urlParams.set(
      "highlight_max_num",
      searchOptions.highlightMaxNum.toString(),
    );
    urlParams.set("highlight_window", searchOptions.highlightWindow.toString());
    urlParams.set("recency_bias", searchOptions.recencyBias.toString());
    urlParams.set(
      "highlight_results",
      searchOptions.highlightResults ? "true" : "false",
    );
    urlParams.set(
      "use_quote_negated_terms",
      searchOptions.useQuoteNegatedTerms ? "true" : "false",
    );

    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const { signal } = abortController;

    console.log(dateRange())

    urlParams.set("q", queryFiltersRemoved());
    urlParams.set("storyType", selectedStoryType());
    urlParams.set("matchAnyAuthorNames", matchAnyAuthorNames().join(","));
    urlParams.set("matchNoneAuthorNames", matchNoneAuthorNames().join(","));
    urlParams.set("popularityFilters", JSON.stringify(popularityFilters()));
    urlParams.set("sortby", sortBy());
    urlParams.set("dateRange", dateRange());
    urlParams.set("searchType", searchType());
    urlParams.set("page", page().toString());
    setAlgoliaLink(
      `https://hn.algolia.com/?q=${encodeURIComponent(
        queryFiltersRemoved(),
      )}&dateRange=${dateRange()}&sort=by${
        sortBy() == "Relevance" ? "Popularity" : sortBy()
      }&type=${selectedStoryType()}&page=0&prefix=false`,
    );

    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}?${urlParams.toString()}`,
    );

    const time_range = dateRangeSwitch(dateRange());

    let sort_by_field;
    if (sortBy() == "Date") {
      sort_by_field = "time_stamp";
    } else if (sortBy() == "Popularity") {
      sort_by_field = "num_value";
    } else {
      sort_by_field = undefined;
    }

    let uncleanedQuery = query();
    let curAnyAuthorNames = matchAnyAuthorNames();
    let curNoneAuthorNames = matchNoneAuthorNames();
    const byNegatedMatches =
      (uncleanedQuery.match(/by:-\w+/g) as string[]) ?? [];
    const byNonNegatedMatches =
      (uncleanedQuery.match(/by:\w+/g) as string[]) ?? [];
    const authorNegatedMatches =
      (uncleanedQuery.match(/author:-\w+/g) as string[]) ?? [];
    const authorNonNegatedMatches =
      (uncleanedQuery.match(/author:\w+/g) as string[]) ?? [];

    if (byNegatedMatches.length > 0) {
      curNoneAuthorNames = [
        ...new Set(
          [...curNoneAuthorNames, ...byNegatedMatches].map((a) =>
            a.replace("by:-", "").replace("by:", "").trim(),
          ),
        ),
      ];
    }
    if (authorNegatedMatches.length > 0) {
      curNoneAuthorNames = [
        ...new Set(
          [...curNoneAuthorNames, ...authorNegatedMatches].map((a) =>
            a.replace("author:-", "").replace("author:", "").trim(),
          ),
        ),
      ];
    }

    if (byNonNegatedMatches.length > 0) {
      curAnyAuthorNames = [
        ...new Set(
          [...curAnyAuthorNames, ...byNonNegatedMatches].map((a) =>
            a.replace("by:-", "").replace("by:", "").trim(),
          ),
        ),
      ];
    }
    if (authorNonNegatedMatches.length > 0) {
      curAnyAuthorNames = [
        ...new Set(
          [...curAnyAuthorNames, ...authorNonNegatedMatches].map((a) =>
            a.replace("author:-", "").replace("author:", "").trim(),
          ),
        ),
      ];
    }

    let curNumValues = popularityFilters()["num_value"];
    let scoreGtMatch = uncleanedQuery.match(/points>\d+/);
    let scoreLtMatch = uncleanedQuery.match(/points<\d+/);
    if (scoreGtMatch) {
      curNumValues = {
        ...curNumValues,
        gt: parseInt(scoreGtMatch[0].split(">")[1]),
      };
    }
    if (scoreLtMatch) {
      curNumValues = {
        ...curNumValues,
        lt: parseInt(scoreLtMatch[0].split("<")[1]),
      };
    }

    let curNumComments = popularityFilters()["num_comments"];
    let commentsGtMatch = uncleanedQuery.match(/comments>\d+/);
    let commentsLtMatch = uncleanedQuery.match(/comments<\d+/);
    if (commentsGtMatch) {
      curNumComments = {
        ...curNumComments,
        gt: parseInt(commentsGtMatch[0].split(">")[1]),
      };
    }
    if (commentsLtMatch) {
      curNumComments = {
        ...curNumComments,
        lt: parseInt(commentsLtMatch[0].split("<")[1]),
      };
    }

    let curStoryID = popularityFilters()["storyID"];
    let storyIDMatch = uncleanedQuery.match(/story:\d+/);
    if (storyIDMatch) {
      curStoryID = parseInt(storyIDMatch[0].split(":")[1]);
    }

    const reqBody = {
      query: queryFiltersRemoved(),
      search_type: searchType() === "autocomplete" ? "fulltext" : searchType(),
      page: page(),
      highlight_options: {
        highlight_strategy: "exactmatch",
        highlight_results: searchOptions.highlightResults,
        highlight_delimiters: searchOptions.highlightDelimiters,
        highlight_threshold: searchOptions.highlightThreshold,
        highlight_max_num: searchOptions.highlightMaxNum,
        highlight_window: searchOptions.highlightWindow,
        highlight_max_length: searchOptions.highlightMaxLength,
      },
      use_weights: false,
      sort_options: {
        sort_by: sort_by_field
          ? {
              field: sort_by_field,
              order: "desc",
            }
          : undefined,
      },
      use_quote_negated_terms: searchOptions.useQuoteNegatedTerms,
      filters: getFilters({
        dateRange: time_range,
        selectedStoryType: selectedStoryType(),
        matchAnyAuthorNames: curAnyAuthorNames,
        matchNoneAuthorNames: curNoneAuthorNames,
        gtStoryPoints: curNumValues?.gt,
        ltStoryPoints: curNumValues?.lt,
        gtStoryComments: curNumComments?.gt,
        ltStoryComments: curNumComments?.lt,
        storyID: curStoryID,
      }),
      page_size: searchOptions.pageSize,
      score_threshold: searchOptions.scoreThreshold,
    };

    if (
      searchOptions.rerankType &&
      searchOptions.rerankType != "none" &&
      searchOptions.prefetchAmount
    ) {
      reqBody["sort_options"]["sort_by"] = {
        prefetch_amount: searchOptions.prefetchAmount,
        rerank_type: searchOptions.rerankType,
      } as any;
    }

    if (queryFiltersRemoved() === "") {
      fetch(`${trieveBaseURL}/chunks/scroll`, {
        method: "POST",
        body: JSON.stringify({
          sort_by: sort_by_field
            ? {
                field:
                  sort_by_field === "relevance" ? "time_stamp" : sort_by_field,
                order: "desc",
              }
            : {
                field: "time_stamp",
                order: "desc",
              },
          filters: getFilters({
            dateRange: time_range,
            selectedStoryType: selectedStoryType(),
            matchAnyAuthorNames: curAnyAuthorNames,
            matchNoneAuthorNames: curNoneAuthorNames,
            gtStoryPoints: curNumValues?.gt,
            ltStoryPoints: curNumValues?.lt,
            gtStoryComments: curNumComments?.gt,
            ltStoryComments: curNumComments?.lt,
            storyID: curStoryID,
          }),
          page_size: 30,
        }),
        headers: {
          "X-API-VERSION": "V2",
          "Content-Type": "application/json",
          "TR-Dataset": trieveDatasetId,
          Authorization: trieveApiKey,
        },
        signal,
      })
        .then((response) => {
          return response.json();
        })
        .then((data: { chunks: ChunkMetadataStringTagSet[] }) => {
          const stories: Story[] = data.chunks.map((chunk): Story => {
            let title_html = undefined;
            let body_html = undefined;
            if (!chunk.tag_set?.includes("story")) {
              body_html = chunk.chunk_html
                ?.replaceAll("\n\n", "<br>")
                .trim()
                .replace(/<br>$/, "");
            } else {
              const html_split_by_newlines = chunk.chunk_html?.split("\n\n");
              let title_split = 0;
              if (chunk.link) {
                title_split = 1;
              }

              title_html = html_split_by_newlines?.[title_split];
              body_html = html_split_by_newlines
                ?.slice(title_split + 1)
                .join("<br>")
                .trim()
                .replace(/<br>$/, "");
            }

            return {
              title_html,
              body_html,
              parent_id: (chunk.metadata?.parent ?? "").toString(),
              parent_title: chunk.metadata?.parent_title ?? "",
              url: chunk.link ?? "",
              points: chunk.metadata?.score ?? 0,
              user: chunk.metadata?.by ?? "",
              time: new Date(chunk.time_stamp + "Z"),
              title: chunk.metadata?.title ?? "",
              kids: chunk.metadata?.kids ?? [],
              type: chunk.metadata?.type ?? "",
              id: chunk.tracking_id ?? "0",
            };
          });

          if (!sort_by_field || sort_by_field === "time_stamp") {
            stories.sort((a, b) => {
              return b.time.getTime() - a.time.getTime();
            });
          }

          setStories(stories);
          setLoading(false);
        })
        .catch((error) => {
          if ((error as Error).name !== "AbortError") {
            console.error("Error:", error);
            setLoading(false);
          }
        });
      return;
    }

    let apiPath = "search";
    if (searchType() === "autocomplete") {
      apiPath = "autocomplete";
    }
    fetch(`${trieveBaseURL}/chunk/${apiPath}`, {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: {
        "X-API-VERSION": "V2",
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
        Authorization: trieveApiKey,
      },
      signal,
    })
      .then((response) => {
        const serverTiming = response.headers.get("Server-Timing");
        if (serverTiming) {
          const metrics = serverTiming.split(",");
          const durations = metrics.map((metric) => {
            const duration = parseFloat(metric.split(";")[1].split("=")[1]);
            return duration;
          });
          const totalLatency = durations.reduce((a, b) => a + b, 0);
          const latencyInSeconds = totalLatency / 1000;
          setLatency(latencyInSeconds);
        }
        return response.json();
      })
      .then((data: SearchChunkQueryResponseBody) => {
        const stories: Story[] =
          data.chunks.map((score_chunk): Story => {
            const chunk = score_chunk.chunk;
            let title_html = undefined;
            let body_html = undefined;
            if (!chunk.tag_set?.includes("story")) {
              body_html = chunk.chunk_html
                ?.replaceAll("\n\n", "<br>")
                .trim()
                .replace(/<br>$/, "");
            } else {
              const html_split_by_newlines = chunk.chunk_html?.split("\n\n");
              let title_split = 0;
              if (chunk.link) {
                title_split = 1;
              }

              title_html = html_split_by_newlines?.[title_split];
              body_html = html_split_by_newlines
                ?.slice(title_split + 1)
                .join("<br>")
                .trim()
                .replace(/<br>$/, "");
            }

            return {
              title_html,
              body_html,
              parent_id: (chunk.metadata?.parent ?? "").toString(),
              parent_title: chunk.metadata?.parent_title ?? "",
              score: score_chunk.score,
              url: chunk.link ?? "",
              points: chunk.metadata?.score ?? 0,
              user: chunk.metadata?.by ?? "",
              time: new Date(chunk.time_stamp + "Z") ?? "",
              title: chunk.metadata?.title ?? "",
              kids: chunk.metadata?.kids ?? [],
              type: chunk.metadata?.type ?? "",
              id: chunk.tracking_id ?? "0",
            };
          }) ?? [];

        if (sort_by_field === "time_stamp") {
          stories.sort((a, b) => {
            return b.time.getTime() - a.time.getTime();
          });
        }

        setSearchID(data.id);

        setStories(stories);
        setLoading(false);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          console.error("Error:", error);
          setLoading(false);
        }
      });
  });

  const getRecommendations = (story_id: string) => {
    let curRecommendType = recommendType();
    curRecommendType =
      curRecommendType === "SPLADE" ? "fulltext" : curRecommendType;

    const time_range = dateRangeSwitch(dateRange());
    const filters = getFilters({
      dateRange: time_range,
      selectedStoryType: selectedStoryType(),
      matchAnyAuthorNames: matchAnyAuthorNames(),
      matchNoneAuthorNames: matchNoneAuthorNames(),
      gtStoryPoints: popularityFilters()["num_value"]?.gt,
      ltStoryPoints: popularityFilters()["num_value"]?.lt,
      gtStoryComments: popularityFilters()["num_comments"]?.gt,
      ltStoryComments: popularityFilters()["num_comments"]?.lt,
      storyID: popularityFilters()["storyID"],
    });

    void fetch(trieveBaseURL + `/chunk/recommend`, {
      method: "POST",
      body: JSON.stringify({
        positive_tracking_ids: [story_id.toString()],
        recommend_type: curRecommendType,
        filters,
        limit: 10,
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID as string,
        "X-API-VERSION": "V2",
        Authorization: trieveApiKey,
      },
    })
      .then((response) => response.json())
      .then((data: any) => {
        const stories: Story[] = data.chunks.map((score_chunk: any): Story => {
          const chunk = score_chunk.chunk;
          let title_html = undefined;
          let body_html = undefined;
          if (!chunk.tag_set?.includes("story")) {
            body_html = chunk.chunk_html
              ?.replaceAll("\n\n", "<br>")
              .trim()
              .replace(/<br>$/, "");
          } else {
            const html_split_by_newlines = chunk.chunk_html?.split("\n\n");
            let title_split = 0;
            if (chunk.link) {
              title_split = 1;
            }

            title_html = html_split_by_newlines?.[title_split];
            body_html = html_split_by_newlines
              ?.slice(title_split + 1)
              .join("<br>")
              .trim()
              .replace(/<br>$/, "");
          }

          return {
            title_html,
            body_html,
            parent_id: chunk.metadata?.parent ?? "",
            parent_title: chunk.metadata?.parent_title ?? "",
            score: score_chunk.score,
            url: chunk.link ?? "",
            points: chunk.metadata?.score ?? 0,
            user: chunk.metadata?.by ?? "",
            time: new Date(chunk.time_stamp + "Z"),
            title: chunk.metadata?.title ?? "",
            kids: chunk.metadata?.kids ?? [],
            type: chunk.metadata?.type ?? "",
            id: chunk.tracking_id ?? "0",
          };
        });

        setRecommendedStories(stories);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Error:", error);
        }
      });
  };

  createEffect(() => {
    const curPositiveRecStory = positiveRecStory();
    const recModalOpen = showRecModal();

    if (curPositiveRecStory && recModalOpen) {
      getRecommendations(curPositiveRecStory.id);
    }
  });

  const rateQuery = () => {
    void fetch(`${trieveBaseURL}/analytics/search`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "X-API-version": "2.0",
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
      },
      body: JSON.stringify({
        query_id: searchID(),
        rating: rating().rating,
        note: rating().note,
      }),
    }).then((response) => {
      if (response.ok) {
        createToast({
          type: "success",
          message: "Query rated successfully",
        });
      } else {
        void response
          .json()
          .then((data) => {
            createToast({
              type: "error",
              message: data.message,
            });
          })
          .catch((_) => {
            createToast({
              type: "error",
              message: "Error rating query",
            });
          });
      }
    });
  };

  return (
    <>
      <main class="mx-auto bg-[#F6F6F0] font-verdana text-[13.33px] sm:bg-hn md:m-2 md:mx-auto md:w-[85%]">
        <Header setQuery={setQuery} />
        <Filters
          setSearchOptions={setSearchOptions}
          searchOptions={searchOptions}
          selectedStoryType={selectedStoryType}
          setSelectedStoryType={setSelectedStoryType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          dateRange={dateRange}
          setDateRange={setDateRange}
          searchType={searchType}
          setSearchType={setSearchType}
          latency={latency}
          matchAnyAuthorNames={matchAnyAuthorNames}
          setMatchAnyAuthorNames={setMatchAnyAuthorNames}
          matchNoneAuthorNames={matchNoneAuthorNames}
          setMatchNoneAuthorNames={setMatchNoneAuthorNames}
          popularityFilters={popularityFilters}
          setPopularityFilters={setPopularityFilters}
        />
        <Search
          query={query}
          setQuery={setQuery}
          algoliaLink={algoliaLink}
          setOpenRateQueryModal={setOpenRateQueryModal}
        />
        <Switch>
          <Match when={stories().length === 0}>
            <Switch>
              <Match when={loading()}>
                <div class="flex items-center justify-center py-2">
                  <span class="animate-pulse text-xl">
                    {queryFiltersRemoved() === "" ? "Scrolling" : "Searching"}{" "}
                  </span>
                </div>
              </Match>
              <Match when={!loading()}>
                <div class="flex items-center justify-center py-2">
                  <span class="text-xl">No stories found</span>
                </div>
              </Match>
            </Switch>
          </Match>
          <Match when={stories().length > 0}>
            <div class="pb-2">
              <For each={stories()}>
                {(story, i) => (
                  <Story
                    story={story}
                    sendCTR={() => {
                      void fetch(trieveBaseURL + `/analytics/ctr`, {
                        method: "PUT",
                        body: JSON.stringify({
                          request_id: searchID(),
                          clicked_chunk_tracking_id: story.id,
                          position: i() + 1,
                          ctr_type: "search",
                        }),
                        headers: {
                          "Content-Type": "application/json",
                          "TR-Dataset": trieveDatasetId,
                          Authorization: trieveApiKey,
                        },
                      });
                    }}
                    onClickRecommend={() => {
                      setRecommendedStories([]);
                      setPositiveRecStory(story);
                      setShowRecModal(true);
                    }}
                  />
                )}
              </For>
            </div>
          </Match>
        </Switch>
        <Show when={stories().length > 0 && queryFiltersRemoved() != ""}>
          <div class="mx-auto flex items-center justify-center space-x-2 py-3">
            <PaginationController
              page={page()}
              setPage={setPage}
              totalPages={500}
            />
          </div>
        </Show>
        <Footer />
      </main>
      <FullScreenModal show={showRecModal} setShow={setShowRecModal}>
        <div class="flex w-full max-w-[70vw] flex-col items-center justify-center">
          <Switch>
            <Match when={recommendedStories().length === 0}>
              <p class="animate-pulse">
                Loading stories similar by {recommendType()} for{" "}
                {recommendDateRangeDisplay()} to:{" "}
                <span class="font-semibold">{positiveRecStory()?.title}</span>
                ...
              </p>
            </Match>
            <Match when={recommendedStories().length > 0}>
              <p class="pb-2">
                Showing stories similar by{" "}
                <span class="inline">
                  <select
                    id="stories"
                    class="form-select w-fit border border-stone-300 bg-hn p-1 text-zinc-600"
                    onChange={(e) => {
                      setRecommendType(e.currentTarget.value);
                    }}
                    value={recommendType()}
                  >
                    <option value="semantic">Semantic</option>
                    <option value="fulltext">Fulltext</option>
                  </select>
                </span>{" "}
                for {recommendDateRangeDisplay()} to:{" "}
                <span class="font-semibold">{positiveRecStory()?.title}</span>
              </p>
              <div class="border-t pt-2">
                <For each={recommendedStories()}>
                  {(story) => (
                    <Story
                      story={story}
                      sendCTR={() => {}}
                      onClickRecommend={() => {
                        setRecommendedStories([]);
                        setPositiveRecStory(story);
                        setShowRecModal(true);
                      }}
                    />
                  )}
                </For>
              </div>
            </Match>
          </Switch>
        </div>
      </FullScreenModal>
      <FullScreenModal
        show={openRateQueryModal}
        setShow={setOpenRateQueryModal}
      >
        <div class="min-w-[250px] sm:min-w-[300px]">
          <div class="mb-4 text-center text-xl">Rate query:</div>
          <div>
            <label class="block text-lg">Rating: {rating().rating}</label>
            <input
              type="range"
              class="min-w-full text-[#ff6600] accent-[#ff6600] focus:outline-none"
              value={rating().rating}
              min="0"
              max="10"
              onInput={(e) => {
                setRating({
                  rating: parseInt(e.target.value),
                  note: rating().note,
                });
              }}
            />
            <div class="flex justify-between space-x-1">
              <label class="block text-sm">0</label>
              <label class="block items-end text-sm">10</label>
            </div>
          </div>
          <div>
            <label class="mt-2 block text-lg">
              Optional Explanation of Rating (contact info if willing):
            </label>
            <textarea
              class="mt-2 min-w-full rounded-md border border-stone-300 p-1 focus-within:border-stone-500 active:border-stone-500"
              placeholder="Enter written feedback about search ..."
              value={rating().note}
              onInput={(e) => {
                setRating({
                  rating: rating().rating,
                  note: (e.target as HTMLTextAreaElement).value,
                });
              }}
            />
          </div>
          <div class="mx-auto mt-3 flex w-fit flex-col space-y-3 pt-2">
            <button
              class="flex w-fit items-center gap-x-1 border border-stone-300 bg-hn p-1 text-zinc-600 hover:border-stone-900 hover:text-zinc-900"
              onClick={() => {
                rateQuery();
                setOpenRateQueryModal(false);
              }}
            >
              Submit Rating
            </button>
          </div>
        </div>
      </FullScreenModal>
    </>
  );
};
