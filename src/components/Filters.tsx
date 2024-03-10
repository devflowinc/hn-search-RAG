import { FiExternalLink } from "solid-icons/fi";
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
  algoliaLink: string;
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
            <option value="all">All</option>
            <option selected value="story">
              Stories
            </option>
            <option value="comment">Comments</option>
            <option value="job">Jobs</option>
            <option value="poll">Polls</option>
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
            <option>Relevance</option>
            <option>Popularity</option>
            <option>Date</option>
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
            <option value="all">All Time</option>
            <option value="last24h">Last 24h</option>
            <option value="pastWeek">Past Week</option>
            <option value="pastMonth">Past Month</option>
            <option value="pastYear">Past Year</option>
            <option>Custom Range</option>
          </select>
        </div>
        <div class="flex items-center space-x-2">
          <a
            class="flex text-sm p-1 border border-stone-300 text-zinc-600 bg-hn items-center"
            href={props.algoliaLink}>
            Try with Algolia <FiExternalLink class="pl-1 w-5" />
          </a>
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
