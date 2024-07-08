export interface ScoreChunkDTO {
  score_chunks: ChunkMetadataDTO[];
  total_chunk_pages: number;
}

export const isScoreChunkDTO = (obj: any): obj is ScoreChunkDTO => {
  if (typeof obj !== "object" || obj === null) return false;

  return (
    indirectHasOwnProperty(obj, "score_chunks") &&
    Array.isArray(obj.score_chunks) &&
    obj.score_chunks.every(isChunkMetadataDTO) &&
    indirectHasOwnProperty(obj, "total_chunk_pages") &&
    typeof obj.total_chunk_pages === "number"
  );
};

export const indirectHasOwnProperty = (obj: unknown, prop: string): boolean => {
  return Object.prototype.hasOwnProperty.call(obj, prop);
};

export interface ChunkMetadataDTO {
  metadata: ChunkDTO[];
  score: number;
}

export const isChunkMetadataDTO = (obj: any): obj is ChunkMetadataDTO => {
  if (typeof obj !== "object" || obj === null) return false;

  return (
    indirectHasOwnProperty(obj, "metadata") &&
    Array.isArray(obj.metadata) &&
    obj.metadata.every(isChunkMetadata) &&
    indirectHasOwnProperty(obj, "score") &&
    typeof obj.score === "number"
  );
};

export interface ChunkDTO {
  id: string;
  content: string;
  chunk_html?: string;
  link: string | null;
  qdrant_point_id: string;
  created_at: string;
  updated_at: string;
  tag_set: string | null;
  tracking_id: string | null;
  time_stamp: string | null;
  file_id: string | null;
  file_name: string | null;
  metadata: Record<string, never> | null;
  weight: number;
}

export interface ChunkMetadataWithFileData {
  id: string;
  content: string;
  chunk_html?: string;
  link?: string;
  qdrant_point_id: string;
  created_at: string;
  updated_at: string;
  tag_set?: string;
  file_id?: string;
  file_name?: string;
  metadata: Record<string, never> | null;
  tracking_id?: string;
  time_stamp?: string;
  weight: number;
}

export const isChunkMetadataWithFileData = (
  chunk: unknown,
): chunk is ChunkMetadataWithFileData => {
  if (typeof chunk !== "object" || chunk === null) return false;

  return (
    indirectHasOwnProperty(chunk, "id") &&
    typeof (chunk as ChunkMetadataWithFileData).id === "string" &&
    indirectHasOwnProperty(chunk, "chunk_html") &&
    typeof (chunk as ChunkMetadataWithFileData).chunk_html === "string" &&
    indirectHasOwnProperty(chunk, "qdrant_point_id") &&
    typeof (chunk as ChunkMetadataWithFileData).qdrant_point_id === "string" &&
    indirectHasOwnProperty(chunk, "created_at") &&
    typeof (chunk as ChunkMetadataWithFileData).created_at === "string" &&
    indirectHasOwnProperty(chunk, "updated_at") &&
    typeof (chunk as ChunkMetadataWithFileData).updated_at === "string" &&
    indirectHasOwnProperty(chunk, "tag_set") &&
    (typeof (chunk as ChunkMetadataWithFileData).tag_set === "string" ||
      (chunk as ChunkMetadataWithFileData).tag_set === null) &&
    (typeof (chunk as ChunkMetadataWithFileData).metadata === "object" ||
      (chunk as ChunkMetadataWithFileData).metadata === null) &&
    indirectHasOwnProperty(chunk, "weight") &&
    typeof (chunk as ChunkMetadataWithFileData).weight === "number"
  );
};

export interface DatasetIDs {
  All: string | null;
  Stories: string;
  Comments: string;
  Jobs: string;
  Polls: string;
  [key: string]: null | string;
}

export const isChunkMetadata = (chunk: unknown): chunk is ChunkDTO => {
  if (typeof chunk !== "object" || chunk === null) return false;

  return (
    indirectHasOwnProperty(chunk, "id") &&
    typeof (chunk as ChunkDTO).id === "string" &&
    indirectHasOwnProperty(chunk, "qdrant_point_id") &&
    typeof (chunk as ChunkDTO).qdrant_point_id === "string" &&
    indirectHasOwnProperty(chunk, "created_at") &&
    typeof (chunk as ChunkDTO).created_at === "string" &&
    indirectHasOwnProperty(chunk, "updated_at") &&
    typeof (chunk as ChunkDTO).updated_at === "string" &&
    indirectHasOwnProperty(chunk, "tag_set") &&
    (typeof (chunk as ChunkDTO).tag_set === "string" ||
      (chunk as ChunkDTO).tag_set === null) &&
    (typeof (chunk as ChunkDTO).metadata === "object" ||
      (chunk as ChunkDTO).metadata === null)
  );
};

export const dateRangeSwitch = (value: string): TimeRange | null => {
  switch (value) {
    case "all":
      return null;
    case "last24h":
      return {
        gt: Math.floor(
          new Date(Date.now() - 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastWeek":
      return {
        gt: Math.floor(
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastMonth":
      return {
        gt: Math.floor(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime() / 1000,
        ),
        lt: Math.floor(new Date().getTime() / 1000),
      };
    case "pastYear":
      return {
        gt: Math.floor(
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).getTime() / 1000,
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
  dateRange: TimeRange | null,
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
    must: filters,
  };
};

export const getAlgoliaLink = (
  dataset: string,
  time_range: string,
  sortby: string,
) => {
  let link = `https://hn.algolia.com/?q=&sort=${sortby}&prefix&page=0&dateRange=${time_range}&type=${dataset}`;
  return link;
};
