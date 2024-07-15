/* eslint-disable prefer-const */
import { enUS } from "date-fns/locale";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { Chart } from "chart.js";

import "chartjs-adapter-date-fns";
import {
  AnalyticsFilter,
  AnalyticsParams,
  LatencyDatapoint,
} from "../../../types";
import { getLatency } from "../api/analytics";

export const parseCustomDateString = (dateString: string) => {
  const [datePart, timePart] = dateString.split(" ");
  let [year, month, day] = datePart.split("-");
  let [hour, minute, second] = timePart.split(":");
  let [wholeSec] = second.split(".");

  month = month.padStart(2, "0");
  day = day.padStart(2, "0");
  hour = hour.padStart(2, "0");
  minute = minute.padStart(2, "0");
  wholeSec = wholeSec.padStart(2, "0");

  const isoString = `${year}-${month}-${day}T${hour}:${minute}:${wholeSec}Z`;

  return new Date(isoString);
};

interface LatencyGraphProps {
  params: {
    filter: AnalyticsFilter;
    granularity: AnalyticsParams["granularity"];
  };
}

export const LatencyGraph = (props: LatencyGraphProps) => {
  const [canvasElement, setCanvasElement] = createSignal<HTMLCanvasElement>();
  const [latencyPoints, setLatencyPoints] = createSignal<LatencyDatapoint[]>(
    []
  );
  let chartInstance: Chart | null = null;
  createEffect(async () => {
    let results = await getLatency(
      props.params.filter,
      props.params.granularity
    );
    setLatencyPoints(results);
  });

  createEffect(() => {
    const canvas = canvasElement();
    const data = latencyPoints();

    if (!canvas || !data) return;

    if (!chartInstance) {
      // Create the chart only if it doesn't exist
      chartInstance = new Chart(canvas, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              borderColor: "purple",
              pointBackgroundColor: "purple",
              backgroundColor: "rgba(128, 0, 128, 0.1)", // Light purple background
              borderWidth: 1,
              label: "Time",
              data: [],
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
                text: "Latency (ms)",
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
              offset: data.length <= 1,
            },
          },
          animation: {
            duration: 0,
          },
        },
      });
    }

    if (props.params.granularity === "day") {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = "day";
    } else if (props.params.granularity === "minute") {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = "minute";
    } else {
      // @ts-expect-error library types not updated
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      chartInstance.options.scales["x"].time.unit = undefined;
    }

    if (data.length <= 1) {
      // @ts-expect-error library types not updated
      chartInstance.options.scales["x"].offset = true;
    }

    // Update the chart data
    chartInstance.data.labels = data.map(
      (point) => new Date(parseCustomDateString(point.time_stamp))
    );
    chartInstance.data.datasets[0].data = data.map(
      (point) => point.average_latency
    );
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
