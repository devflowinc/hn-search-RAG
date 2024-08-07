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
      <div class="rounded-md bg-blue-100 p-4 mx-3 my-2">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg
              class="h-5 w-5 text-blue-800"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div class="ml-3 flex-1 md:flex md:justify-between">
            <p class="text-sm text-blue-800">
              Click-through rate (CTR) data is currently being tracked, but
              still only available via API. Frontend component coming soon!
            </p>
            <p class="mt-3 text-sm md:ml-6 md:mt-0">
              <a
                href="https://docs.trieve.ai/api-reference/analytics/get-ctr-analytics"
                class="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 hover:underline align-middle"
              >
                Docs
                <span aria-hidden="true"> &rarr;</span>
              </a>
            </p>
          </div>
        </div>
      </div>

      <FilterBar
        filters={analyticsFilters}
        setFilters={setAnalyticsFilters}
        analyticsType={analyticsType}
        setAnalyticsType={setAnalyticsType}
      />
      <div class="grid grid-cols-2 items-start gap-2 p-3">
        <Show when={analyticsType() === "search"}>
          <ChartCard class="flex flex-col justify-between px-4" width={2}>
            <QueryCounts
              params={{
                filter: analyticsFilters.filter,
              }}
            />
          </ChartCard>
          <ChartCard
            title="Requests Per Time Period"
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
