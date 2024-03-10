import { Setter } from "solid-js";

export interface FiltersProps {
  selectedDataset: string;
  setSelectedDataset: Setter<string>;
  sortBy: string;
  setSortBy: Setter<string>;
  dateRange: string;
  setDateRange: Setter<string>;
  searchType: string;
  setSearchType: Setter<string>;
}

export default function Filters(props: FiltersProps) {
  return (
    <div class="p-2 flex justify-between items-center">
      <div class="flex space-x-2 text-black items-center">
        <span class="text-sm">Search</span>
        <div>
          <label for="stories" class="sr-only">
            Stories
          </label>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 text-sm w-fit bg-hn"
            onChange={(e) => props.setSelectedDataset(e.currentTarget.value)}
            value={props.selectedDataset}>
            <option>All</option>
            <option selected>Stories</option>
            <option>Comments</option>
            <option>Ask HN</option>
            <option>Show HN</option>
            <option>Jobs</option>
            <option>Polls</option>
          </select>
        </div>
        <span class="text-sm">{"by "}</span>
        <div>
          <label for="popularity" class="sr-only">
            Popularity
          </label>
          <select
            id="popularity"
            class="form-select text-zinc-600 p-1 border border-stone-300 text-sm bg-hn"
            onChange={(e) => props.setSortBy(e.currentTarget.value)}
            value={props.sortBy}>
            <option value="relevance">Relevance</option>
            <option value="popularity">Popularity</option>
            <option value="date">Date</option>
          </select>
        </div>
        <span class="text-sm">{"for "}</span>
        <div>
          <label for="date-range" class="sr-only">
            Date Range
          </label>
          <select
            id="date-range"
            class="form-select text-zinc-600 p-1 border border-stone-300 text-sm bg-hn"
            onChange={(e) => props.setDateRange(e.currentTarget.value)}
            value={props.dateRange}>
            <option>All Time</option>
            <option>Last 24h</option>
            <option>Past Week</option>
            <option>Past Month</option>
            <option>Past Year</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm">Search Type: </span>
        <div>
          <label for="stories" class="sr-only">
            Stories
          </label>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 text-sm w-fit bg-hn"
            onChange={(e) => props.setSearchType(e.currentTarget.value)}
            value={props.searchType}>
            <option selected value={"hybrid"}>
              Hybrid
            </option>
            <option value={"semantic"}>Semantic</option>
            <option value={"fulltext"}>Full Text</option>
          </select>
        </div>
      </div>
    </div>
  );
}
