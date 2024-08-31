import { enUS } from "date-fns/locale";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { Chart } from "chart.js/auto";
import { parseCustomDateString } from "./LatencyGraph";

interface RpsGraphProps {
  params: {
    filter: AnalyticsFilter;
    granularity: AnalyticsParams["granularity"];
  };
}

import "chartjs-adapter-date-fns";
import {
  AnalyticsFilter,
  AnalyticsParams,
  UsageDatapoint,
} from "../../../types";
import { getRpsUsageGraph } from "../api/analytics";

export const RpsGraph = (props: RpsGraphProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [usageQuery, setUsage] = createSignal<UsageDatapoint[]>([]);
  let chartInstance: Chart | null = null;

  createEffect(() => {
    getRpsUsageGraph(props.params.filter, props.params.granularity).then(
      (results) => {
        setUsage(results);
      },
    );
  });

  createEffect(() => {
    const canvas = canvasElement();
    let data = usageQuery();
    if (data.length > 7) {
      data = data.slice(data.length - 7);
    }

    if (!canvas || !data) return;

    if (!chartInstance) {
      // Create the chart only if it doesn't exist
      chartInstance = new Chart(canvas, {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            {
              label: "Requests",
              data: [],
              borderColor: "purple",
              backgroundColor: "rgba(255, 102, 0, 0.9)", // Light purple background
              barThickness: data.length === 1 ? 40 : undefined,
            },
          ],
        },
        options: {
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              grid: { color: "rgba(128, 0, 128, 0.1)" }, // Light purple grid
              title: {
                text: "Requests",
                display: true,
              },
              beginAtZero: true,
            },
            x: {
              adapters: {
                date: {
                  locale: enUS,
                },
              },
              type: "time",
              title: {
                text: "Timestamp",
                display: true,
              },
              offset: false,
            },
          },
          animation: {
            duration: 0,
          },
        },
      });
    }

    if (data.length <= 1) {
      // @ts-expect-error library types not updated
      chartInstance.options.scales["x"].offset = true;
      // Set the bar thickness to 40 if there is only one data point
      // @ts-expect-error library types not updated
      chartInstance.data.datasets[0].barThickness = 40;
    } else {
      // @ts-expect-error library types not updated
      chartInstance.data.datasets[0].barThickness = undefined;
    }

    if (props.params.granularity === "day") {
      // @ts-expect-error library types not updated

      chartInstance.options.scales["x"].time.unit = "day";
    } else if (props.params.granularity === "minute") {
      // @ts-expect-error library types not updated

      chartInstance.options.scales["x"].time.unit = "minute";
    } else {
      // @ts-expect-error library types not updated

      chartInstance.options.scales["x"].time.unit = undefined;
    }

    // Update the chart data;
    chartInstance.data.labels = data.map(
      (point) => new Date(parseCustomDateString(point.time_stamp, true)),
    );
    chartInstance.data.datasets[0].data = data.map((point) => point.requests);
    chartInstance.update();
  });

  onCleanup(() => {
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
  });

  return <canvas ref={setCanvasElement} class="h-full w-full" />;
};
