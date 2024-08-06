import { differenceInHours, format } from "date-fns";
import {
  AnalyticsParams,
  HeadQuery,
  LatencyDatapoint,
  RpsDatapoint,
  SearchQueryEvent,
  SearchTypeCount,
  LatencyGraphResponse,
  HeadQueryResponse,
  SearchQueryResponse,
  QueryCountResponse,
  RPSGraphResponse,
  AnalyticsFilter,
  DateRangeFilter,
  SortBy,
  SortOrder,
  RAGAnalyticsFilter,
  RagQueryEvent,
  RagQueryResponse,
  RAGUsageResponse,
} from "../../../types";

const apiHost = import.meta.env.VITE_TRIEVE_API_URL as string;
const trieveDatasetId = import.meta.env.VITE_TRIEVE_DATASET_ID as string;
const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY as string;

export const formatDateForApi = (date: Date) => {
  return date
    .toLocaleString("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "UTC",
    })
    .replace(",", "");
};

interface HasDateRange {
  date_range?: DateRangeFilter;
}

export const transformAnalyticsFilter = (filter: HasDateRange) => {
  return {
    ...filter,
    date_range: filter.date_range
      ? transformDateParams(filter.date_range)
      : undefined,
  };
};

export const transformDateParams = (params: DateRangeFilter) => {
  return {
    gt: params.gt ? formatDateForApi(params.gt) : undefined,
    lt: params.lt ? formatDateForApi(params.lt) : undefined,
    gte: params.gte ? formatDateForApi(params.gte) : undefined,
    lte: params.lte ? formatDateForApi(params.lte) : undefined,
  };
};

export const formatSensibleTimestamp = (
  date: Date,
  range: AnalyticsFilter["date_range"]
): string => {
  const highTime = range.lt || range.lte || new Date();
  if (!highTime) {
    return date.toLocaleString();
  }
  const lowTime = range.gt || range.gte;
  if (!lowTime) {
    return date.toLocaleDateString();
  }

  const hourDifference = differenceInHours(highTime, lowTime);
  // If the hour difference is 24 hours or less, format only with the time
  if (hourDifference <= 24) {
    return format(date, "HH:mm:ss");
  }

  // If the hour difference is 7 days or less, format with the date and time
  if (hourDifference <= 24 * 7) {
    return date.toLocaleDateString();
  }

  // If the hour difference is 30 days or less, format with the date
  if (hourDifference <= 24 * 30) {
    return date.toLocaleDateString();
  }

  return date.toLocaleDateString();
};

export const getLatency = async (
  filters: AnalyticsFilter,
  granularity: AnalyticsParams["granularity"]
): Promise<LatencyDatapoint[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      granularity: granularity,
      type: "latency_graph",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trends bubbles: ${response.statusText}`);
  }

  const data: LatencyGraphResponse =
    (await response.json()) as unknown as LatencyGraphResponse;

  return data.latency_points;
};

export const getRps = async (
  filters: AnalyticsFilter,
  granularity: AnalyticsParams["granularity"]
): Promise<RpsDatapoint[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      granularity,
      type: "search_usage_graph",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch trends bubbles: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as RPSGraphResponse;
  return data.rps_points;
};

export const getHeadQueries = async (
  filters: AnalyticsFilter,
  page: number
): Promise<HeadQuery[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      page,
      type: "head_queries",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch head queries: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as HeadQueryResponse;
  return data.queries;
};

export const getLowConfidenceQueries = async (
  filters: AnalyticsFilter,
  page: number,
  threshold?: number
): Promise<SearchQueryEvent[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      page,
      threshold,
      type: "low_confidence_queries",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch low confidence queries: ${response.statusText}`
    );
  }

  const data = (await response.json()) as unknown as SearchQueryResponse;
  return data.queries;
};

export const getNoResultQueries = async (
  filters: AnalyticsFilter,
  page: number
): Promise<SearchQueryEvent[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      page,
      type: "no_result_queries",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch no result queries: ${response.statusText}`
    );
  }

  const data = (await response.json()) as unknown as SearchQueryResponse;
  return data.queries;
};

export const getQueryCounts = async (
  filters: AnalyticsFilter
): Promise<SearchTypeCount[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      filter: transformAnalyticsFilter(filters),
      type: "count_queries",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch no result queries: ${response.statusText}`
    );
  }

  const data = (await response.json()) as unknown as QueryCountResponse;
  return data.total_queries;
};

export const getSearchQueries = async (
  filter: AnalyticsFilter,
  sort_by: SortBy,
  sort_order: SortOrder,
  page: number
): Promise<SearchQueryEvent[]> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      page,
      sort_by,
      sort_order,
      filter: filter ? transformAnalyticsFilter(filter) : undefined,
      type: "search_queries",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch search event: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as SearchQueryResponse;
  return data.queries;
};

export const getRAGQueries = async ({
  page,
  filter,
  sort_by,
  sort_order,
}: {
  page: number;
  filter?: RAGAnalyticsFilter;
  sort_by?: SortBy;
  sort_order?: SortOrder;
}): Promise<RagQueryEvent[]> => {
  const response = await fetch(`${apiHost}/analytics/rag`, {
    credentials: "include",
    method: "POST",
    body: JSON.stringify({
      page,
      sort_by,
      sort_order,
      filter: filter ? transformAnalyticsFilter(filter) : undefined,
      type: "rag_queries",
    }),
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch head queries: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as RagQueryResponse;
  return data.queries;
};

export const getRAGUsage = async (
  filter?: RAGAnalyticsFilter
): Promise<RAGUsageResponse> => {
  const response = await fetch(`${apiHost}/analytics/rag`, {
    method: "POST",
    credentials: "include",
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "rag_usage",
      filter: filter ? transformAnalyticsFilter(filter) : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch head queries: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as RAGUsageResponse;
  return data;
};
