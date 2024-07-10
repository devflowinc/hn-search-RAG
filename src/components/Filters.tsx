import { Accessor, Setter, Show } from "solid-js";

export interface FiltersProps {
  selectedDataset: Accessor<string>;
  setSelectedDataset: Setter<string>;
  sortBy: Accessor<string>;
  setSortBy: Setter<string>;
  dateRange: Accessor<string>;
  setDateRange: Setter<string>;
  searchType: Accessor<string>;
  setSearchType: Setter<string>;
  latency: Accessor<number | null>;
  count: Accessor<number | null>;
}

export default function Filters(props: FiltersProps) {
  return (
    <div class="p-2 flex justify-between items-center">
      <div class="flex flex-wrap gap-2 text-black items-center">
        <span>Search</span>
        <div>
          <label for="stories" class="sr-only">
            Stories
          </label>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 w-fit bg-hn"
            onChange={(e) => props.setSelectedDataset(e.currentTarget.value)}
            value={props.selectedDataset()}
          >
            <option value="all">All</option>
            <option selected value="story">
              Stories
            </option>
            <option value="comment">Comments</option>
            <option value="job">Jobs</option>
            <option value="poll">Polls</option>
          </select>
        </div>
        <span>by</span>
        <div>
          <label for="popularity" class="sr-only">
            Popularity
          </label>
          <select
            id="popularity"
            class="form-select text-zinc-600 p-1 border border-stone-300 bg-hn"
            onChange={(e) => props.setSortBy(e.currentTarget.value)}
            value={props.sortBy()}
          >
            <option>Relevance</option>
            <option>Popularity</option>
            <option>Date</option>
          </select>
        </div>
        <span>for</span>
        <div>
          <label for="date-range" class="sr-only">
            Date Range
          </label>
          <select
            id="date-range"
            class="form-select text-zinc-600 p-1 border border-stone-300 bg-hn"
            onChange={(e) => props.setDateRange(e.currentTarget.value)}
            value={props.dateRange()}
          >
            <option value="all">All Time</option>
            <option value="last24h">Last 24h</option>
            <option value="pastWeek">Past Week</option>
            <option value="pastMonth">Past Month</option>
            <option value="pastYear">Past Year</option>
            <option>Custom Range</option>
          </select>
        </div>
        <span>with</span>
        <div>
          <select
            id="stories"
            class="form-select text-zinc-600 p-1 border border-stone-300 w-fit bg-hn"
            onChange={(e) => props.setSearchType(e.currentTarget.value)}
            value={props.searchType()}
          >
            <option selected value={"hybrid"}>
              Hybrid
            </option>
            <option value={"semantic"}>Semantic</option>
            <option value={"fulltext"}>Splade</option>
          </select>
        </div>
      </div>
      <div class="flex items-center">
        <Show when={props.count() !== null}>
          <p>{props.count()} results</p>
        </Show>
        <Show when={props.latency() !== null}>
          <p>({props.latency()}s)</p>
        </Show>
      </div>
    </div>
  );
}
