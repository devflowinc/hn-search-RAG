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

export interface DatasetIDs {
  All: string | null;
  Stories: string;
  Comments: string;
  Jobs: string;
  Polls: string;
  [key: string]: null | string;
}

export const isChunkMetadata = (
  chunk: unknown,
): chunk is ChunkDTO => {
  if (typeof chunk !== "object" || chunk === null) return false;

  return (
    indirectHasOwnProperty(chunk, "id") &&
    typeof (chunk as ChunkDTO).id === "string" &&
    indirectHasOwnProperty(chunk, "content") &&
    typeof (chunk as ChunkDTO).content === "string" &&
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

export const dateRangeSwitch = (value: string) => {
  switch (value) {
    case "All Time":
      return ["", new Date().toISOString()];
    case "Last 24h":
      return [
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ];
    case "Past Week":
      return [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ];
    case "Past Month":
      return [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ];
    case "Past Year":
      return [
        new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString(),
      ];
      break;
    case "Custom Range":
      //TODO: Implement custom range
      break;
    default:
      break;
  }
};