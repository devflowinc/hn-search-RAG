import { createMemo, createSignal, JSX } from "solid-js";
import { DateRangeOption, AnalyticsParams, dateRanges } from "../../types";
import { Select } from "./Select";

const getReasonableGranularityFromDateRange = (
  dateRange: DateRangeOption,
): AnalyticsParams["granularity"] => {
  switch (dateRange.label) {
    case "Past Hour":
      return "minute";
    case "Past Day":
      return "hour";
    case "Past Week":
      return "day";
    default:
      return "hour";
  }
};

export const useSimpleTimeRange = () => {
  const [dateOption, setDateOption] = createSignal<DateRangeOption>(
    dateRanges[2],
  );

  const granularity = createMemo(() => {
    return getReasonableGranularityFromDateRange(dateOption());
  });

  const filter = createMemo(() => {
    return {
      date_range: {
        gt: dateOption().date,
      },
    };
  });

  return { filter, granularity, dateOption, setDateOption };
};

interface SimpleTimeRangeSelectorProps {
  label?: JSX.Element;
  dateOption: DateRangeOption;
  setDateOption: (date: DateRangeOption) => void;
}

export const SimpleTimeRangeSelector = (
  props: SimpleTimeRangeSelectorProps,
) => {
  return (
    <Select
      label={props.label}
      class="min-w-[80px] !bg-white"
      selected={props.dateOption.label}
      onSelected={(e) => {
        props.setDateOption(dateRanges.find((d) => d.label === e)!);
      }}
      options={dateRanges.map((d) => d.label)}
    />
  );
};
