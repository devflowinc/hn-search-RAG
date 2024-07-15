import { ChartCard } from "../components/analytics/charts/ChartCard";
import { HeadQueries } from "../components/analytics/charts/HeadQueries";
import { LatencyGraph } from "../components/analytics/charts/LatencyGraph";
import { QueryCounts } from "../components/analytics/charts/QueryCounts";
import { RpsGraph } from "../components/analytics/charts/RpsGraph";
import {
  SimpleTimeRangeSelector,
  useSimpleTimeRange,
} from "../components/analytics/SimpleTimeRangeSelector";
import { Footer } from "../components/Footer";
import Header from "../components/Header";

export const AnalyticsPage = () => {
  const rpsDate = useSimpleTimeRange();
  const headQueriesDate = useSimpleTimeRange();
  const latencyDate = useSimpleTimeRange();

  return (
    <main class="bg-[#F6F6F0] sm:bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header />
      <div class="grid grid-cols-2 items-start gap-2 p-8">
        <ChartCard class="flex flex-col justify-between px-4" width={2}>
          <QueryCounts />
        </ChartCard>
        <ChartCard
          title="Requests Per Second"
          class="flex flex-col justify-between px-4"
          width={1}
        >
          <RpsGraph
            params={{
              filter: rpsDate.filter(),
              granularity: rpsDate.granularity(),
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
              filter: latencyDate.filter(),
              granularity: latencyDate.granularity(),
            }}
          />
        </ChartCard>

        <ChartCard title="Head Queries" class="px-4" width={1}>
          <HeadQueries
            params={{
              filter: headQueriesDate.filter(),
            }}
          />
        </ChartCard>
      </div>
      <Footer />
    </main>
  );
};
