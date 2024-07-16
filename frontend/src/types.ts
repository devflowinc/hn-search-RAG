import { subDays, subHours } from "date-fns";

export const indirectHasOwnProperty = (obj: unknown, prop: string): boolean => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export interface GeoInfo {
  lat: number;
  lon: number;
}
export interface ChunkMetadataStringTagSet {
  id: string;
  link: string | null;
  qdrant_point_id: string;
  created_at: string;
  updated_at: string;
  chunk_html: string | null;
  metadata: Record<string, never> | null;
  tracking_id: string | null;
  time_stamp: string | null;
  weight: number;
  location: GeoInfo | null;
  image_urls: string[] | null;
  tag_set: string | null;
  num_value: number | null;
}
export interface ScoreChunkDTO {
  metadata: ChunkMetadataStringTagSet[];
  highlights?: string[];
  score: number;
}

export interface SearchChunkQueryResponseBody {
  score_chunks: ScoreChunkDTO[];
  total_chunk_pages: number;
}

export interface DatasetIDs {
  All: string | null;
  Stories: string;
  Comments: string;
  Jobs: string;
  Polls: string;
  [key: string]: null | string;
}

export const dateRangeSwitch = (value: string): TimeRange | null => {
  switch (value) {
    case "all":
      return null;
    case "last24h":
      return {
        gt: Math.floor(
          new Date(Date.now() - 24 * 60 * 60 * 1000).getTime() / 1000
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastWeek":
      return {
        gt: Math.floor(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastMonth":
      return {
        gt: Math.floor(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastYear":
      return {
        gt: Math.floor(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime() / 1000
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "Custom Range":
      return null;
    //TODO: Implement custom range
    default:
      return null;
  }
};

export interface TimeRange {
  gt?: number;
  gte?: number;
  lt?: number;
  lte?: number;
}

export const getFilters = (
  selectedDataset: string | null,
  dateRange: TimeRange | null
) => {
  const filters = [];
  if (selectedDataset && selectedDataset !== "all") {
    filters.push({
      field: "tag_set",
      match: [selectedDataset],
    });
  }
  if (dateRange) {
    if (dateRange.gt) {
      filters.push({
        field: "time_stamp",
        range: dateRange,
      });
    }
  }

  return {
    jsonb_prefilter: false,
    must: filters,
  };
};

export interface SearchOptions {
  scoreThreshold: number | null;
  pageSize: number;
  highlightDelimiters: string[];
  highlightMaxLength: number;
  highlightMaxNum: number;
  highlightWindow: number;
  recencyBias: number;
  slimChunks: boolean;
  highlightResults: boolean;
}

export interface HNStory {
  title: string;
  url: string;
  score: number;
  by: string;
  time: number;
  descendants: number;
  type: string;
  id: string;
}

export interface DateRangeFilter {
  gt?: Date;
  lt?: Date;
  gte?: Date;
  lte?: Date;
}

export interface AnalyticsFilter {
  date_range: DateRangeFilter;
  search_method?: "full_text" | "hybrid" | "semantic" | "bm25";
  search_type?:
    | "search"
    | "autocomplete"
    | "rag"
    | "search_over_groups"
    | "search_within_groups";
}

export interface RequiredAnalyticsFilter {
  date_range: DateRangeFilter;
  search_method?: AnalyticsFilter["search_method"];
  search_type?: AnalyticsFilter["search_type"];
}

// The search analytics params bar conforms to this
export interface AnalyticsParams {
  filter: RequiredAnalyticsFilter;
  granularity: "minute" | "second" | "hour" | "day";
}

export interface LatencyDatapoint {
  average_latency: number;
  time_stamp: string;
}

export interface RpsDatapoint {
  average_rps: number;
  time_stamp: string;
}

export interface SearchQueryEvent {
  id: string;
  search_type: string;
  query: string;
  request_params: string;
  latency: number;
  top_score: number;
  results: string[];
  dataset_id: string;
  created_at: string;
}

export interface HeadQuery {
  query: string;
  count: number;
}

export interface SearchTypeCount {
  search_type: AnalyticsFilter["search_type"];
  search_method: AnalyticsFilter["search_method"];
  search_count: number;
}

export interface QueryCountResponse {
  total_queries: SearchTypeCount[];
}

export interface HeadQueryResponse {
  queries: HeadQuery[];
}

export interface SearchQueryResponse {
  queries: SearchQueryEvent[];
}

export interface RPSGraphResponse {
  rps_points: RpsDatapoint[];
}

export interface LatencyGraphResponse {
  latency_points: LatencyDatapoint[];
}

export const timeFrameOptions: AnalyticsParams["granularity"][] = [
  "day",
  "hour",
  "minute",
  "second",
];

export type DateRangeOption = {
  date: Date;
  label: string;
};

export const dateRanges: DateRangeOption[] = [
  {
    label: "Past Hour",
    date: subHours(new Date(), 1),
  },
  {
    label: "Past Day",
    date: subDays(new Date(), 1),
  },
  {
    label: "Past Week",
    date: subDays(new Date(), 7),
  },
];

export type SortBy = "created_at" | "latency" | "top_score";

export type SortOrder = "desc" | "asc";

export type AnalyticsType = "search" | "rag";

export interface RequiredRAGAnalyticsFilter {
  rag_type?: "chosen_chunks" | "all_chunks"; // Optional because that means "BOTH"
  date_range: DateRangeFilter;
}

export interface RAGAnalyticsFilter {
  rag_type?: "chosen_chunks" | "all_chunks";
  date_range?: DateRangeFilter;
}

export interface RagQueryEvent {
  id: string;
  rag_type: string;
  user_message: string;
  search_id: string;
  results: ChunkMetadataStringTagSet[];
  dataset_id: string;
  created_at: string;
}

export interface RAGUsageResponse {
  total_queries: number;
}

export interface RagQueryResponse {
  queries: RagQueryEvent[];
}
