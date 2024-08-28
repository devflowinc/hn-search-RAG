/* eslint-disable no-constant-binary-expression */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
  untrack,
} from "solid-js";
import Filters from "../components/search/Filters";
import Header from "../components/Header";
import { Story, StoryComponent } from "../components/search/Story";
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
import {
  BiRegularClipboard,
  BiSolidCheckSquare,
  BiSolidUserRectangle,
} from "solid-icons/bi";
import { SolidMarkdown } from "solid-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { FiSend } from "solid-icons/fi";
import { AiOutlineRobot } from "solid-icons/ai";
import { VsClose } from "solid-icons/vs";
import { BsInfoCircle } from "solid-icons/bs";

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
    case "keyword":
      return 5;
    default:
      return 0.3;
  }
};

const storyTypePlurals = {
  comment: "comments",
  poll: "polls",
  all: "items",
  job: "jobs",
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
  const [matchAnySiteURLs, setMatchAnySiteURLs] = createSignal(
    urlParams
      .get("matchAnySiteURLs")
      ?.split(",")
      .map((url) => url.trim())
      .filter((url) => url !== "") ?? [],
  );
  const [matchNoneSiteURLs, setMatchNoneSiteURLs] = createSignal(
    urlParams
      .get("matchNoneSiteURLs")
      ?.split(",")
      .map((url) => url.trim())
      .filter((url) => url !== "") ?? [],
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
    urlParams.get("sortby") ?? "relevance",
  );
  const [dateRange, setDateRange] = createSignal<string>(
    urlParams.get("dateRange") ?? "all",
  );
  const [totalPages, setTotalPages] = createSignal(10);
  const [stories, setStories] = createSignal<Story[]>([]);
  const [aIStories, setAIStories] = createSignal<Story[]>([]);
  const [aIMessages, setAIMessages] = createSignal<string[]>([]);
  const [userFollowup, setUserFollowup] = createSignal();
  const [loading, setLoading] = createSignal(true);
  const [query, setQuery] = createSignal(urlParams.get("q") ?? "");
  const [suggestedQueries, setSuggestedQueries] = createSignal<string[]>([]);
  const [suggestionContext, setSuggestionContext] = createSignal<string>("");
  const [loadingSuggestedQueries, setLoadingSuggestedQueries] =
    createSignal(false);
  const [_suggestedQueriesAbortController, setSuggestedQueriesAbortController] =
    createSignal<AbortController>();
  const [searchType, setSearchType] = createSignal(
    urlParams.get("searchType") ?? "fulltext",
  );
  const [recommendType, setRecommendType] = createSignal("semantic");
  const [page, setPage] = createSignal(Number(urlParams.get("page") ?? "1"));
  const [offsetStoryIds, setOffsetStoryIds] = createSignal<string[]>([]);
  const [algoliaLink, setAlgoliaLink] = createSignal("");
  const [latency, setLatency] = createSignal<number | null>(null);
  const [positiveRecStory, setPositiveRecStory] = createSignal<Story | null>(
    null,
  );
  const [recommendedStories, setRecommendedStories] = createSignal<Story[]>([]);
  const [aiEnabled, setAiEnabled] = createSignal(
    urlParams.get("getAISummary") === "true",
  );
  const [loadingAiSummary, setLoadingAiSummary] = createSignal(false);
  const [aiSummaryPrompt, setAISummaryPrompt] = createSignal(
    "The previous user message contains a search query. Based on and using the provided documents, generate a 1-3 paragraph markdown completion that would be helpful to the user. Summarize if the query is empty. Each paragraph should include at most 2 sentences. Do not include citations or references. Do not reference the query.",
  );
  const [aiMaxTokens, setAiMaxTokens] = createSignal(500);
  const [aiFrequencyPenalty, setAiFrequencyPenalty] = createSignal(0.7);
  const [aiPresencePenalty, setAiPresencePenalty] = createSignal(0.7);
  const [aiTemperature, setAiTemperature] = createSignal(0.5);
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
  const [typoCheck, setTypoCheck] = createSignal(true);

  const handleReader = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
  ) => {
    setLoadingAiSummary(true);
    let done = false;
    const lastEvenIndex =
      aIMessages().length % 2 === 0
        ? aIMessages().length
        : aIMessages().length - 1;
    if (lastEvenIndex != 0) {
      setAIMessages((prev) => [
        ...prev.slice(0, lastEvenIndex),
        "Loading...",
        ...prev.slice(lastEvenIndex + 1),
      ]);
    }

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (doneReading) {
        done = doneReading;
        setLoadingAiSummary(false);
      } else if (value) {
        const decoder = new TextDecoder();
        const newText = decoder.decode(value);

        setAIMessages((prev) => {
          const lastEvenIndex =
            prev.length % 2 === 0 ? prev.length : prev.length - 1;
          let currentMessage = prev[lastEvenIndex];
          if (currentMessage && currentMessage.includes("Loading")) {
            currentMessage = currentMessage.replace("Loading...", "");
          }
          const newMessage = (currentMessage ? currentMessage : "") + newText;
          return [
            ...prev.slice(0, lastEvenIndex),
            newMessage,
            ...prev.slice(lastEvenIndex + 1),
          ];
        });
      }
    }
  };

  const getSuggestions = (
    cleanQuery: string,
    filters: any,
    suggestionType: string,
    searchType: string,
  ) => {
    setLoadingSuggestedQueries(true);
    const abortController = new AbortController();
    setSuggestedQueriesAbortController((prev) => {
      prev?.abort();
      return abortController;
    });

    fetch(`${trieveBaseURL}/chunk/suggestions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
        Authorization: trieveApiKey,
      },
      body: JSON.stringify({
        query: cleanQuery ? cleanQuery : undefined,
        suggestion_type: suggestionType,
        search_type: searchType,
        filters,
        context: suggestionContext() ? suggestionContext() : undefined,
      }),
      signal: abortController.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data.queries)) {
          return;
        }
        const receivedQueries: string[] = data.queries;
        const randomSuggestions: string[] = [];
        const randomNumbers: number[] = [];
        while (randomNumbers.length < 4) {
          const randNum =
            Math.floor(Math.random() * (data.queries.length - 2 + 1)) + 1;
          if (!randomNumbers.includes(randNum)) {
            randomNumbers.push(randNum);
          }
        }
        console.log(randomNumbers);
        randomNumbers.map((num) =>
          randomSuggestions.push(receivedQueries[num]),
        );

        setSuggestedQueries(randomSuggestions);
        setLoadingSuggestedQueries(false);
      })
      .catch((err) => console.error("Error getting suggested queries", err));
  };

  onMount(() => {
    window.addEventListener("popstate", () => {
      setQuery("");
    });

    const searchInput = document.getElementById("primary-search-input");
    searchInput?.focus();

    window.addEventListener("keydown", (e) => {
      if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
        e.preventDefault();
        searchInput?.focus();
      }
    });
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
      .replace(/author:-[\w.-]+/g, "")
      .replace(/author:[\w.-]+/g, "")
      .replace(/by:-[\w.-]+/g, "")
      .replace(/by:[\w.-]+/g, "")
      .replace(/site:-[\w.-]+/g, "")
      .replace(/site:[\w.-]+/g, "")
      .replace(/story:\d+/g, "")
      .replace(/points>:\d+/g, "")
      .replace(/points<:\d+/g, "")
      .replace(/comments>:\d+/g, "")
      .replace(/comments<:\d+/g, "")
      .trimStart();
  });

  const curFilterValues = createMemo(() => {
    setOffsetStoryIds([]);
    const time_range = dateRangeSwitch(dateRange());

    const uncleanedQuery = query();
    let curAnyAuthorNames = matchAnyAuthorNames();
    let curNoneAuthorNames = matchNoneAuthorNames();
    let curAnySiteURLs = matchAnySiteURLs();
    let curNoneSiteURLs = matchNoneSiteURLs();
    const byNegatedMatches =
      (uncleanedQuery.match(/by:-[\w.-]+/g) as string[]) ?? [];
    const byNonNegatedMatches =
      (uncleanedQuery.match(/by:(?!-)[\w.-]+/g) as string[]) ?? [];
    const authorNegatedMatches =
      (uncleanedQuery.match(/author:-[\w.-]+/g) as string[]) ?? [];
    const authorNonNegatedMatches =
      (uncleanedQuery.match(/author:(?!-)[\w.-]+/g) as string[]) ?? [];
    const siteNonNegatedMatches =
      (uncleanedQuery.match(/site:(?!-)[\w.-]+/g) as string[]) ?? [];
    const siteNegatedMatches =
      (uncleanedQuery.match(/site:-[\w.-]+/g) as string[]) ?? [];

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

    if (siteNegatedMatches.length > 0) {
      curNoneSiteURLs = [
        ...new Set(
          [...curNoneSiteURLs, ...siteNegatedMatches].map((a) =>
            a.replace("site:-", "").replace("site:", "").trim(),
          ),
        ),
      ];
    }
    if (siteNonNegatedMatches.length > 0) {
      curAnySiteURLs = [
        ...new Set(
          [...curAnySiteURLs, ...siteNonNegatedMatches].map((a) =>
            a.replace("site:-", "").replace("site:", "").trim(),
          ),
        ),
      ];
    }

    let curNumValues = popularityFilters()["num_value"];
    const scoreGtMatch = uncleanedQuery.match(/points>\d+/);
    const scoreLtMatch = uncleanedQuery.match(/points<\d+/);
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
    const commentsGtMatch = uncleanedQuery.match(/comments>\d+/);
    const commentsLtMatch = uncleanedQuery.match(/comments<\d+/);
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
    const storyIDMatch = uncleanedQuery.match(/story:\d+/);
    if (storyIDMatch) {
      curStoryID = parseInt(storyIDMatch[0].split(":")[1]);
    }

    const curFilter = getFilters({
      dateRange: time_range,
      selectedStoryType: selectedStoryType(),
      matchAnyAuthorNames: curAnyAuthorNames,
      matchNoneAuthorNames: curNoneAuthorNames,
      matchAnySiteNames: curAnySiteURLs,
      matchNoneSiteNames: curNoneSiteURLs,
      gtStoryPoints: curNumValues?.gt,
      ltStoryPoints: curNumValues?.lt,
      gtStoryComments: curNumComments?.gt,
      ltStoryComments: curNumComments?.lt,
      storyID: curStoryID,
    });

    return curFilter;
  });

  createEffect(() => {
    const cleanedQuery = queryFiltersRemoved();
    const filters = curFilterValues();
    const curSearchType = searchType();
    let suggestionType = "keyword";
    if (curSearchType === "semantic") {
      suggestionType = "semantic";
    }
    const suggestSearchType =
      curSearchType === "hybrid" || curSearchType === "autocomplete"
        ? "fulltext"
        : curSearchType === "keyword"
          ? "bm25"
          : curSearchType;

    getSuggestions(cleanedQuery, filters, suggestionType, suggestSearchType);
  });

  createEffect(() => {
    const curUserFollowup = userFollowup();
    const curCleanedQuery = queryFiltersRemoved();
    const curStories = aIStories().length ? aIStories() : stories();

    const completionAbortController = new AbortController();

    const handleCompletion = async () => {
      const response = await fetch(`${trieveBaseURL}/chunk/generate`, {
        headers: {
          "Content-Type": "application/json",
          "TR-Dataset": trieveDatasetId,
          Authorization: trieveApiKey,
        },
        method: "POST",
        body: JSON.stringify({
          chunk_ids: curStories.map((story) => story.trieve_id),
          prev_messages: [
            {
              content: curCleanedQuery,
              role: "user",
            },
            ...untrack(aIMessages).map((message, index) => {
              return {
                content: message,
                role: index % 2 === 0 ? "assistant" : "user",
              };
            }),
          ],
          prompt: curCleanedQuery
            ? aiSummaryPrompt()
            : "Summarize the document(s)",
          max_tokens: aiMaxTokens(),
          frequency_penalty: aiFrequencyPenalty(),
          presence_penalty: aiPresencePenalty(),
          temperature: aiTemperature(),
        }),
        signal: completionAbortController.signal,
      });
      const reader = response.body?.getReader();

      if (!reader) {
        return;
      }

      await handleReader(reader);
    };

    if (aiEnabled() && curUserFollowup) {
      void handleCompletion();
    }

    onCleanup(() => {
      completionAbortController.abort();
    });
  });

  createEffect(() => {
    const completionAbortController = new AbortController();
    const curCleanedQuery = queryFiltersRemoved();
    const curStories = aIStories().length ? aIStories() : stories();
    setAIMessages([]);

    const handleCompletion = async () => {
      const response = await fetch(`${trieveBaseURL}/chunk/generate`, {
        headers: {
          "Content-Type": "application/json",
          "TR-Dataset": trieveDatasetId,
          Authorization: trieveApiKey,
        },
        method: "POST",
        body: JSON.stringify({
          chunk_ids: curStories.map((story) => story.trieve_id),
          prev_messages: [
            {
              content: aiSummaryPrompt(),
              role: "system",
            },
          ],
          prompt: curCleanedQuery
            ? aiSummaryPrompt()
            : "Summarize the document(s)",
          max_tokens: aiMaxTokens(),
          frequency_penalty: aiFrequencyPenalty(),
          presence_penalty: aiPresencePenalty(),
          temperature: aiTemperature(),
        }),
        signal: completionAbortController.signal,
      });
      const reader = response.body?.getReader();

      if (!reader) {
        return;
      }

      await handleReader(reader);
    };

    if (curStories.length && aiEnabled()) {
      void handleCompletion();
    }

    onCleanup(() => {
      completionAbortController.abort("new stream started");
    });
  });

  createEffect(() => {
    setSearchOptions("scoreThreshold", defaultScoreThreshold(searchType()));
  });

  createEffect(() => {
    query();
    setPage(1);
  });

  createEffect(() => {
    const curQuery = queryFiltersRemoved();

    // eslint-disable-next-line solid/reactivity
    const curOptions = searchOptions;

    const abortController = new AbortController();

    fetch(`${trieveBaseURL}/chunk/count`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": trieveDatasetId,
        Authorization: trieveApiKey,
      },
      signal: abortController.signal,
      body: JSON.stringify({
        query: curQuery,
        filters: curFilterValues(),
        use_quote_negated_terms: curOptions.useQuoteNegatedTerms,
        score_threshold: curOptions.scoreThreshold,
        limit: 500,
        search_type:
          searchType() === "hybrid" || searchType() === "autocomplete"
            ? "fulltext"
            : searchType() === "keyword"
              ? "bm25"
              : searchType(),
      }),
    }).then((response) =>
      response
        .json()
        .then((data) =>
          setTotalPages(Math.ceil(data.count / curOptions.pageSize)),
        ),
    );

    onCleanup(() => {
      abortController.abort("cleanup count");
    });
  });

  createEffect(() => {
    setLoading(true);
    if (abortController) {
      abortController.abort();
    }

    abortController = new AbortController();
    const { signal } = abortController;

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
      )}&dateRange=${dateRange()}&sort=by${sortBy()}&type=${selectedStoryType()}&page=0&prefix=false`,
    );
    urlParams.set("getAISummary", aiEnabled().toString());

    window.history.pushState(
      {
        urlParamsStringified: urlParams.toString(),
      },
      "",
      `${window.location.pathname}?${urlParams.toString()}`,
    );

    let sort_by_field;
    if (sortBy() == "relevance" || /^[A-Z]/.test(sortBy())) {
      sort_by_field = undefined;
    } else {
      sort_by_field = sortBy();
    }

    const reqBody: any = {
      query: queryFiltersRemoved(),
      search_type:
        searchType() === "autocomplete"
          ? "fulltext"
          : searchType() === "keyword"
            ? "bm25"
            : searchType(),
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
      typo_options: {
        correct_typos: typoCheck(),
      },
      use_quote_negated_terms: searchOptions.useQuoteNegatedTerms,
      filters: curFilterValues(),
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

    if (!queryFiltersRemoved() || queryFiltersRemoved() === "") {
      const curOffsetStoryIds = offsetStoryIds();
      const curFilters = curFilterValues();
      if (curOffsetStoryIds.length) {
        if (!curFilters.must_not) {
          curFilters.must_not = [];
        } else {
          curFilters.must_not = curFilters.must_not.filter(
            (filter) => Object.keys(filter)[0] !== "ids",
          );
        }

        curFilters.must_not?.push({
          ids: curOffsetStoryIds,
        } as any);
      }

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
          filters: curFilters,
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
        .then(
          (data: {
            chunks: ChunkMetadataStringTagSet[];
            offset_chunk_id?: string;
          }) => {
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
                if (chunk.link && chunk.chunk_html?.includes(chunk.link)) {
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
                trieve_id: chunk.id,
              };
            });

            if (!sort_by_field || sort_by_field === "time_stamp") {
              stories.sort((a, b) => {
                return b.time.getTime() - a.time.getTime();
              });
            }

            setStories((prevStories) => {
              if (curOffsetStoryIds.length) {
                return [...prevStories, ...stories];
              } else {
                return stories;
              }
            });
            setLoading(false);
          },
        )
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
    if (searchType() === "semantic") {
      apiPath = "autocomplete";
      reqBody["extend_results"] = true;
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
              if (chunk.link && chunk.chunk_html?.includes(chunk.link)) {
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
              trieve_id: chunk.id,
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
      matchAnySiteNames: matchAnySiteURLs(),
      matchNoneSiteNames: matchNoneSiteURLs(),
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
            if (chunk.link && chunk.chunk_html?.includes(chunk.link)) {
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
          matchAnySiteURLs={matchAnySiteURLs}
          matchNoneSiteURLs={matchNoneSiteURLs}
          setMatchAnySiteURLs={setMatchAnySiteURLs}
          setMatchNoneSiteURLs={setMatchNoneSiteURLs}
          popularityFilters={popularityFilters}
          setPopularityFilters={setPopularityFilters}
          typoCheck={typoCheck}
          setTypoCheck={setTypoCheck}
        />
        <Search
          query={query}
          setQuery={setQuery}
          suggestedQueries={suggestedQueries}
          loadingSuggestedQueries={loadingSuggestedQueries}
          getSuggestedQueries={() => {
            const cleanedQuery = queryFiltersRemoved();
            const filters = curFilterValues();
            const curSearchType = searchType();
            let suggestionType = "keyword";
            if (curSearchType === "semantic") {
              suggestionType = "semantic";
            }
            const suggestSearchType =
              curSearchType === "hybrid" || curSearchType === "autocomplete"
                ? "fulltext"
                : curSearchType === "keyword"
                  ? "bm25"
                  : curSearchType;

            getSuggestions(
              cleanedQuery,
              filters,
              suggestionType,
              suggestSearchType,
            );
          }}
          algoliaLink={algoliaLink}
          setOpenRateQueryModal={setOpenRateQueryModal}
          aiEnabled={aiEnabled}
          setLoadingAi={setLoadingAiSummary}
          setAiEnabled={setAiEnabled}
          aiSummaryPrompt={aiSummaryPrompt}
          setAiSummaryPrompt={setAISummaryPrompt}
          aiMaxTokens={aiMaxTokens}
          setAiMaxTokens={setAiMaxTokens}
          aiFrequencyPenalty={aiFrequencyPenalty}
          setAiFrequencyPenalty={setAiFrequencyPenalty}
          aiPresencePenalty={aiPresencePenalty}
          setAiPresencePenalty={setAiPresencePenalty}
          aiTemperature={aiTemperature}
          setAiTemperature={setAiTemperature}
          suggestionContext={suggestionContext}
          setSuggestionContext={setSuggestionContext}
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
                  <span class="text-xl">
                    No{" "}
                    {(storyTypePlurals as any)[selectedStoryType()] ||
                      "stories"}{" "}
                    found
                  </span>
                </div>
              </Match>
            </Switch>
          </Match>
          <Match when={stories().length > 0}>
            <div class="flex-row-reverse lg:flex">
              <Show when={aiEnabled()}>
                <div class="lg:w-5/12 lg:border-l lg:border-stone-300">
                  <div class="border-t lg:hidden" />
                  <div class="flex w-fit flex-wrap gap-1 px-3 pt-3 text-xs lg:pt-0">
                    <Switch>
                      <Match when={aIStories().length > 0}>
                        <For each={aIStories()}>
                          {(story) => (
                            <a
                              class="flex gap-0.5 border border-stone-300 px-1 py-0.5 hover:border-stone-600 hover:bg-[#FFFFF0]"
                              href={
                                "https://news.ycombinator.com/item?id=" +
                                story.id
                                  .replaceAll("<mark><b>", "")
                                  .replaceAll("</b></mark>", "")
                              }
                              target="_blank"
                            >
                              <p>
                                {story.title?.slice(0, 75) ??
                                  story.body_html
                                    ?.replaceAll("<mark><b>", "")
                                    .replaceAll("</mark></b>", "")
                                    .slice(0, 75)}
                                <Show
                                  when={
                                    (
                                      story.title ??
                                      story.body_html
                                        ?.replaceAll("<mark><b>", "")
                                        .replaceAll("</mark></b>", "") ??
                                      ""
                                    ).length > 75
                                  }
                                >
                                  ...
                                </Show>
                              </p>
                              <button
                                class="hover:text-[#FF6600]"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setLoadingAiSummary(true);
                                  setAIStories((prev) =>
                                    prev.filter((s) => s.id !== story.id),
                                  );
                                }}
                              >
                                <VsClose />
                              </button>
                            </a>
                          )}
                        </For>
                      </Match>
                      <Match when={aIStories().length === 0}>
                        <p class="flex items-center gap-x-2 border border-stone-300 px-1 py-0.5">
                          <BsInfoCircle class="h-3 w-3 pb-[1px]" /> Response
                          currently informed by all search results. Click "Add
                          to AI Context" on any result(s) for more specificity.
                        </p>
                      </Match>
                    </Switch>
                  </div>
                  <Show when={loadingAiSummary() && !aIMessages().join("")}>
                    <div class="m-3 animate-pulse border border-stone-300">
                      <p class="p-3">Loading...</p>
                    </div>
                  </Show>
                  <For each={aIMessages()}>
                    {(message, i) => (
                      <div
                        classList={{
                          "select-text gap-y-2 m-3 border border-stone-300 flex w-fit max-w-[75%]":
                            true,
                          "ml-auto": i() % 2 === 1,
                        }}
                      >
                        <div class="pl-1 pt-[15px]">
                          <Switch>
                            <Match when={i() % 2 === 0}>
                              <AiOutlineRobot class="h-4 w-4" />
                            </Match>
                            <Match when={i() % 2 === 1}>
                              <BiSolidUserRectangle class="h-4 w-4" />
                            </Match>
                          </Switch>
                        </div>
                        <SolidMarkdown
                          remarkPlugins={[remarkBreaks, remarkGfm]}
                          rehypePlugins={[rehypeSanitize]}
                          class="select-text space-y-2 p-3"
                          components={{
                            h1: (props) => {
                              return (
                                <h1 class="mb-4 text-4xl font-bold dark:bg-neutral-700 dark:text-white">
                                  {props.children}
                                </h1>
                              );
                            },
                            h2: (props) => {
                              return (
                                <h2 class="mb-3 text-3xl font-semibold dark:text-white">
                                  {props.children}
                                </h2>
                              );
                            },
                            h3: (props) => {
                              return (
                                <h3 class="mb-2 text-2xl font-medium dark:text-white">
                                  {props.children}
                                </h3>
                              );
                            },
                            h4: (props) => {
                              return (
                                <h4 class="mb-2 text-xl font-medium dark:text-white">
                                  {props.children}
                                </h4>
                              );
                            },
                            h5: (props) => {
                              return (
                                <h5 class="mb-1 text-lg font-medium dark:text-white">
                                  {props.children}
                                </h5>
                              );
                            },
                            h6: (props) => {
                              return (
                                <h6 class="mb-1 text-base font-medium dark:text-white">
                                  {props.children}
                                </h6>
                              );
                            },
                            code: (props) => {
                              const [codeBlock, setCodeBlock] = createSignal();
                              const [isCopied, setIsCopied] =
                                createSignal(false);

                              createEffect(() => {
                                if (isCopied()) {
                                  const timeout = setTimeout(() => {
                                    setIsCopied(false);
                                  }, 800);
                                  return () => {
                                    clearTimeout(timeout);
                                  };
                                }
                              });

                              return (
                                <div class="relative w-full rounded-lg bg-gray-100 px-4 py-2 dark:bg-neutral-700">
                                  <button
                                    class="absolute right-2 top-2 p-1 text-xs hover:text-fuchsia-500 dark:text-white dark:hover:text-fuchsia-500"
                                    onClick={() => {
                                      const code = (codeBlock() as any)
                                        .innerText;

                                      navigator.clipboard.writeText(code).then(
                                        () => {
                                          setIsCopied(true);
                                        },
                                        (err) => {
                                          console.error("failed to copy", err);
                                        },
                                      );
                                    }}
                                  >
                                    <Switch>
                                      <Match when={isCopied()}>
                                        <BiSolidCheckSquare class="h-5 w-5 text-green-500" />
                                      </Match>
                                      <Match when={!isCopied()}>
                                        <BiRegularClipboard class="h-5 w-5" />
                                      </Match>
                                    </Switch>
                                  </button>

                                  <code ref={setCodeBlock}>
                                    {props.children}
                                  </code>
                                </div>
                              );
                            },
                            a: (props) => {
                              return (
                                <a class="underline" href={props.href}>
                                  {props.children}
                                </a>
                              );
                            },
                            blockquote: (props) => {
                              return (
                                <blockquote class="my-4 border-l-4 border-gray-300 bg-gray-100 p-2 py-2 pl-4 italic text-gray-700 dark:bg-neutral-700 dark:text-white">
                                  {props.children}
                                </blockquote>
                              );
                            },
                            ul: (props) => {
                              return (
                                <ul class="my-4 list-outside list-disc space-y-2 pl-5">
                                  {props.children}
                                </ul>
                              );
                            },
                            ol: (props) => {
                              return (
                                <ol class="my-4 list-outside list-decimal space-y-2 pl-5">
                                  {props.children}
                                </ol>
                              );
                            },
                            img: (props) => {
                              return (
                                <img
                                  src={props.src}
                                  alt={props.alt}
                                  class="my-4 h-auto max-w-full rounded-lg shadow-md"
                                />
                              );
                            },
                            table: (props) => (
                              <table class="my-4 border-collapse">
                                {props.children}
                              </table>
                            ),
                            thead: (props) => (
                              <thead class="bg-gray-100">
                                {props.children}
                              </thead>
                            ),
                            tbody: (props) => (
                              <tbody class="bg-white">{props.children}</tbody>
                            ),
                            tr: (props) => (
                              <tr class="border-b border-gray-200 hover:bg-gray-50">
                                {props.children}
                              </tr>
                            ),
                            th: (props) => (
                              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                {props.children}
                              </th>
                            ),
                            td: (props) => (
                              <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {props.children}
                              </td>
                            ),
                          }}
                          children={message}
                        />
                      </div>
                    )}
                  </For>
                  <div class="flex items-center gap-x-2 p-3">
                    <textarea
                      id="ai-followup"
                      autocomplete="do-not-autofill"
                      class="h-10 w-full resize-none border border-stone-300 p-2 focus:outline-none"
                      placeholder="Continue the conversation..."
                      disabled={loadingAiSummary()}
                      onKeyDown={(e: any) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          const element =
                            e.currentTarget as HTMLTextAreaElement;
                          const followup = element.value;
                          setAIMessages([...aIMessages(), followup]);
                          setUserFollowup(followup);
                          element.value = "";
                        }

                        const element = e.currentTarget as HTMLTextAreaElement;
                        element.style.height = "auto";
                        element.style.height = element.scrollHeight - 16 + "px";
                      }}
                    />
                    <button
                      class="btn btn-primary"
                      onClick={() => {
                        const element = document.getElementById(
                          "ai-followup",
                        ) as HTMLTextAreaElement;
                        const followup = element.value;
                        setAIMessages([...aIMessages(), followup]);
                        setUserFollowup(followup);
                        element.value = "";

                        element.style.height = "auto";
                        element.style.height = element.scrollHeight - 16 + "px";
                      }}
                      disabled={loadingAiSummary()}
                    >
                      <FiSend class="h-4 w-4" />
                    </button>
                  </div>
                  <div class="border-t pb-4 lg:hidden" />
                </div>
              </Show>
              <div
                classList={{
                  "pb-2 w-full": true,
                  "lg:w-7/12": queryFiltersRemoved() != "" && aiEnabled(),
                  "animate-pulse": loading(),
                }}
              >
                <For each={stories()}>
                  {(story, i) => (
                    <StoryComponent
                      story={story}
                      aiEnabled={aiEnabled}
                      aiStories={aIStories}
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
                      onClickAddToAI={() => {
                        setAiEnabled(true);
                        setLoadingAiSummary(true);
                        setAIStories((prev) => {
                          if (prev.find((s) => s.id === story.id)) {
                            return prev.filter((s) => s.id !== story.id);
                          } else {
                            return [...prev, story];
                          }
                        });
                      }}
                    />
                  )}
                </For>
              </div>
            </div>
          </Match>
        </Switch>
        <Switch>
          <Match when={queryFiltersRemoved() != ""}>
            <div class="mx-auto flex items-center justify-center space-x-2 py-3">
              <PaginationController
                page={page()}
                setPage={setPage}
                totalPages={totalPages()}
              />
            </div>
          </Match>
          <Match when={queryFiltersRemoved() === "" && stories().length}>
            <button
              class="-mt-1 pb-3 pl-4 text-stone-600"
              onClick={() => {
                setOffsetStoryIds(
                  stories()
                    .filter((s) => s.trieve_id)
                    .map((s) => s.trieve_id as string),
                );
              }}
            >
              More
            </button>
          </Match>
        </Switch>
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
                    <StoryComponent
                      story={story}
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
          <div class="mb-4 text-center text-xl">
            Rate the quality of the search results for this query:
          </div>
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
