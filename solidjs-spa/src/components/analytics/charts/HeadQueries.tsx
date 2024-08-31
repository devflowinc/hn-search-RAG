import { createEffect, createSignal, Show } from "solid-js";
import { PaginationButtons } from "../PaginationButtons";
import { AnalyticsFilter, HeadQuery } from "../../../types";
import { usePagination } from "../usePagination";
import { getHeadQueries } from "../api/analytics";
import { Table, Tr, Th, Td } from "../Table";

interface HeadQueriesProps {
  params: { filter: AnalyticsFilter };
}

export const HeadQueries = (props: HeadQueriesProps) => {
  const pages = usePagination();
  const [results, setResults] = createSignal<HeadQuery[]>([]);

  createEffect(() => {
    const params = props.params;

    getHeadQueries(params.filter, pages.page()).then((results) => {
      if (results.length === 0) {
        pages.setMaxPageDiscovered(pages.page());
      }
      setResults(results);
    });
  });

  return (
    <>
      <Show fallback={<div class="py-8">Loading...</div>} when={results()}>
        {(data) => (
          <Table
            fallback={<div class="py-8 text-center">No Data</div>}
            data={data()}
            headers={
              <Tr>
                <Th>Query</Th>
                <Th class="text-right">Count</Th>
              </Tr>
            }
            // headerz={["Query", "Count"]}
            class="my-2"
          >
            {(row) => (
              <Tr>
                <Td>{row.query}</Td>
                <Td class="text-right">{row.count}</Td>
              </Tr>
            )}
          </Table>
        )}
      </Show>
      <div class="flex justify-end">
        <PaginationButtons size={18} pages={pages} />
      </div>
    </>
  );
};
