import { Accessor, Setter } from "solid-js";

export interface FiltersProps {
  selectedDataset: Accessor<string>;
  setSelectedDataset: Setter<string>;
  dateBias: Accessor<boolean>;
  setDateBias: Setter<boolean>;
  dateRange: Accessor<string[]>;
  setDateRange: Setter<string[]>;
}

export default function Filters(props: FiltersProps) {
  const setDateRange = (value: string) => {
    switch (value) {
      case "All Time":
        props.setDateRange(["All Time", "", new Date().toISOString()]);
        break;
      case "Last 24h":
        props.setDateRange([
          "Last 24h",
          new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ]);
        break;
      case "Past Week":
        props.setDateRange([
          "Past Week",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ]);
        break;
      case "Past Month":
        props.setDateRange([
          "Past Month",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ]);
        break;
      case "Past Year":
        props.setDateRange([
          "Past Year",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          new Date().toISOString(),
        ]);
        break;
      case "Custom Range":
        //TODO: Implement custom range
        break;
      default:
        break;
    }
  };
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
            onChange={(e) => setDateRange(e.currentTarget.value)}
            value={props.dateRange()[0]}>
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
