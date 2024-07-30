import { SetStoreFunction } from "solid-js/store";
import { subDays, subHours } from "date-fns";
import { Accessor, createEffect, Setter } from "solid-js";
import {
  SimpleTimeRangeSelector,
  useSimpleTimeRange,
} from "./SimpleTimeRangeSelector";
import { AnalyticsParams, AnalyticsType } from "../../types";

interface FilterBarProps {
  filters: AnalyticsParams;
  setFilters: SetStoreFunction<AnalyticsParams>;
  analyticsType: Accessor<AnalyticsType>;
  setAnalyticsType: Setter<AnalyticsType>;
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

export const FilterBar = (props: FilterBarProps) => {
  const dateStuff = useSimpleTimeRange();

  createEffect(() => {
    props.setFilters("granularity", dateStuff.granularity());
    props.setFilters("filter", "date_range", dateStuff.filter().date_range);
  });

  return (
    <div class="flex justify-between border-neutral-400 px-3 py-2">
      <div class="flex items-center gap-2">
        <div class="pt-3 text-base">
          <button
            classList={{
              "pr-1 text-md underline": true,
              "font-semibold": props.analyticsType() == "search",
            }}
            onClick={() => props.setAnalyticsType("search")}
          >
            Search Analytics
          </button>
          <span class="pr-1">|</span>
          <button
            classList={{
              "text-md underline": true,
              "font-semibold": props.analyticsType() == "rag",
            }}
            onClick={() => props.setAnalyticsType("rag")}
          >
            RAG Analytics
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <div>
          <SimpleTimeRangeSelector
            label={<div class="text-sm text-neutral-600">Time Range</div>}
            setDateOption={dateStuff.setDateOption}
            dateOption={dateStuff.dateOption()}
          />
        </div>
      </div>
    </div>
  );
};
