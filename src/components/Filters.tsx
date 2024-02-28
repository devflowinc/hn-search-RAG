import { Accessor, Setter } from "solid-js";

export interface FiltersProps {
  selectedDataset: Accessor<string>;
  setSelectedDataset: Setter<string>;
  dateBias: Accessor<boolean>;
  setDateBias: Setter<boolean>;
  dateRange: Accessor<string>;
  setDateRange: Setter<string>;
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
            value={props.selectedDataset()}>
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
            onChange={(e) =>
              props.setDateBias(e.currentTarget.value === "Date")
            }
            value={props.dateBias() ? "Date" : "Popularity"}>
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
            value={props.dateRange()}>
            <option>All Time</option>
            <option>Last 24h</option>
            <option>Past Week</option>
            <option>Past Month</option>
            <option>Past Year</option>
            <option>Custom Range</option>
          </select>
        </div>
      </div>
    </div>
  );
}
