import { createEffect, createSignal, Show } from "solid-js";
import { ChartCard } from "./ChartCard";
import { RAGAnalyticsFilter, RAGUsageResponse } from "../../../types";
import { getRAGUsage } from "../api/analytics";

interface RagUsageProps {
  filter: RAGAnalyticsFilter;
}
export const RagUsage = (props: RagUsageProps) => {
  const [ragUsage, setRagUsage] = createSignal<RAGUsageResponse | null>(null);

  createEffect(() => {
    getRAGUsage(props.filter).then((results) => {
      setRagUsage(results);
    });
  });

  return (
    <ChartCard title="RAG Usage" width={1}>
      <Show
        fallback={<div class="py-6 text-center">Loading...</div>}
        when={ragUsage()}
      >
        {(data) => (
          <div class="py-4 text-center">
            <span class="pr-1 text-3xl">{data().total_queries}</span>
            <span class="text-sm opacity-80">RAG Queries</span>
          </div>
        )}
      </Show>
    </ChartCard>
  );
};
