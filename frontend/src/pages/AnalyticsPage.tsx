import { subDays } from "date-fns";
import { ChartCard } from "../components/analytics/charts/ChartCard";
import { HeadQueries } from "../components/analytics/charts/HeadQueries";
import { LatencyGraph } from "../components/analytics/charts/LatencyGraph";
import { QueryCounts } from "../components/analytics/charts/QueryCounts";
import { RpsGraph } from "../components/analytics/charts/RpsGraph";
import { FilterBar } from "../components/analytics/FilterBar";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import { createStore } from "solid-js/store";
import { AnalyticsParams, AnalyticsType } from "../types";
import { SearchQueries } from "../components/analytics/charts/SearchQueries";
import { createSignal, Show } from "solid-js";
import { RagQueries } from "../components/analytics/charts/RagQueries";
import { RagUsage } from "../components/analytics/charts/RagUsage";

export const AnalyticsPage = () => {
  const [analyticsFilters, setAnalyticsFilters] = createStore<AnalyticsParams>({
    filter: {
      date_range: {
        gt: subDays(new Date(), 7),
      },
    },
    granularity: "hour",
  });

  const [analyticsType, setAnalyticsType] =
    createSignal<AnalyticsType>("search");

  return (
    <main class="bg-[#F6F6F0] sm:bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header />
      <FilterBar
        filters={analyticsFilters}
        setFilters={setAnalyticsFilters}
        analyticsType={analyticsType}
        setAnalyticsType={setAnalyticsType}
      />
      <div class="grid grid-cols-2 items-start gap-2 p-8">
        <Show when={analyticsType() === "search"}>
          <ChartCard class="flex flex-col justify-between px-4" width={2}>
            <QueryCounts
              params={{
                filter: analyticsFilters.filter,
              }}
            />
          </ChartCard>
          <ChartCard
            title="Requests Per Second"
            class="flex flex-col justify-between px-4"
            width={1}
          >
            <RpsGraph
              params={{
                filter: analyticsFilters.filter,
                granularity: analyticsFilters.granularity,
              }}
            />
          </ChartCard>

          <ChartCard
            title="Search Latency"
            class="flex flex-col justify-between px-4"
            width={1}
          >
            <LatencyGraph
              params={{
                filter: analyticsFilters.filter,
                granularity: analyticsFilters.granularity,
              }}
            />
          </ChartCard>

          <SearchQueries
            params={{
              filter: analyticsFilters.filter,
            }}
          />
          <ChartCard title="Head Queries" class="px-4" width={2}>
            <HeadQueries
              params={{
                filter: analyticsFilters.filter,
              }}
            />
          </ChartCard>
        </Show>
        <Show when={analyticsType() === "rag"}>
          <RagQueries filter={analyticsFilters.filter} />
          <RagUsage filter={analyticsFilters.filter} />
        </Show>
      </div>
      <Footer />
    </main>
  );
};
