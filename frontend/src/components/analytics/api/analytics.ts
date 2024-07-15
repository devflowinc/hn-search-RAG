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

export const transformAnalyticsFilter = (filter: AnalyticsFilter) => {
  return {
    ...filter,
    date_range: transformDateParams(filter.date_range),
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
      type: "rps_graph",
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

export const getSearchQuery = async (
  searchId: string
): Promise<SearchQueryEvent> => {
  const response = await fetch(`${apiHost}/analytics/search`, {
    credentials: "include",
    method: "POST",
    headers: {
      "TR-Dataset": trieveDatasetId,
      Authorization: trieveApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      search_id: searchId,
      type: "search_query",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch search event: ${response.statusText}`);
  }

  const data = (await response.json()) as unknown as SearchQueryEvent;
  return data;
};
