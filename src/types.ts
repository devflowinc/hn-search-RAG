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
  chunk: ChunkMetadataStringTagSet;
  highlights?: string[];
  score: number;
}

export interface SearchChunkQueryResponseBody {
  chunks: ScoreChunkDTO[];
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
  let filters = [];
  if (selectedDataset && selectedDataset !== "all") {
    filters.push({
      field: "metadata.type",
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
