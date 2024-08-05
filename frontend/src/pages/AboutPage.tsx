import { createSignal, JSX, Match, Show, Switch } from "solid-js";
import { Footer } from "../components/Footer";
import Header from "../components/Header";

export const AboutPage = () => {
  return (
    <main class="bg-[#F6F6F0] sm:bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header />
      <div class="my-6 flex flex-col gap-y-5">
        <FAQCard
          question="What is Trieve?"
          answer={
            <>
              <p>
                Trieve is all-in-one infrastructure for search, recommendations,
                RAG, and analytics offered via API.
              </p>
              <p>
                Using SOTA search tech requires architecting and maintaining a
                large stack (vector inference, re-ranking, ingest workers,
                delete workers, playgrounds, OLAP analytics db, etc.) around a
                search db. Trieve consolidates all of this into a SaaS-style API
                or licenseable code with terraform and helm depending on your
                preference and security requirements.
              </p>
            </>
          }
        />
        <FAQCard
          question="Why Make a HN Demo?"
          answer={
            <>
              <p>
                1. Show what's possible with Trieve and that it works at scale
              </p>
              <p>2. Get feedback from HN users</p>
              <p>
                3. Make exploring the HN archive better with additional features
                relative to Algolia's (i.e. submitter filters, recommendations,
                boolean operators, RAG, and analytics)
              </p>
            </>
          }
        />
        <FAQCard
          question="How Hard was it to Build the Demo?"
          answer={
            <>
              <p>
                It was moderately difficult. You can see from the repo that our{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve-hn-discovery/commits/main/?after=60a4f4049c47eeb97d25c971b996408d3f5a794a+104"
                >
                  first commit to the repo for this project
                </a>{" "}
                was early in our YC batch in Feb 2024. Took us 5 months to get
                Trieve stable enough to handle ingesting and storing all the HN
                data. It feels awesome to finally have this up and running.
              </p>
              <p>
                The painful portion was that unique one-off work was required
                for the frontend and ingest of this demo; it took 100+ commits.
                The RAG bit could be higher quality, but for now we just
                copied the code from our RAG playground at{" "}
                <a class="underline" href="https://chat.trieve.ai">
                  chat.trieve.ai
                </a>
                .
              </p>
              <p>
                We punted on some frontend for CTR analytics, advanced
                recommendations, and the "Add to chat" functionality similar to
                what Exa offers due to time bounds. We'll add those features if
                this demo gets traction and people actually use it.
              </p>
              <p>
                Tons of respect to the Algolia folks for building HN search the
                first time and maintaining it for so long. It's not easy.
              </p>
            </>
          }
        />
        <FAQCard
          question="Where's the Code?"
          answer={
            <>
              <p>
                Demo itself is open source at{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve-hn-discovery"
                >
                  github.com/devflowinc/trieve-hn-discovery
                </a>{" "}
                although{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve"
                >
                  Trieve
                </a>{" "}
                is only source available.
              </p>
              <p>
                Within the{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve-hn-discovery"
                >
                  trieve-hn-discovery repo
                </a>{" "}
                there are two important folders:{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve-hn-discovery/tree/main/hackernews-ingest"
                >
                  hackernews-ingest
                </a>{" "}
                and{" "}
                <a
                  class="underline"
                  href="https://github.com/devflowinc/trieve-hn-discovery/tree/main/frontend"
                >
                  frontend
                </a>{" "}
                . Respectively, they contain the code for getting data from the{" "}
                <a
                  class="underline"
                  href="https://hacker-news.firebaseio.com/v0/"
                >
                  firebase HN API
                </a>{" "}
                and sending it to the Trieve API, and the code for the SolidJS
                SPA you see at this URL.
              </p>
            </>
          }
        />
        <FAQCard
          question="How Much Does it Cost to Run This Per Month?"
          answer={
            <>
              <table>
                <thead>
                  <tr>
                    <th class="text-left">Machine Type</th>
                    <th class="text-left">Cost/Month</th>
                    <th class="text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1x g2-standard-4</td>
                    <td>$508.90</td>
                    <td>Text-Embeddings-Inference Servers</td>
                  </tr>
                  <tr>
                    <td>4x c2d-highmem-32</td>
                    <td>$5,643.36</td>
                    <td>Qdrant Search Server</td>
                  </tr>
                  <tr>
                    <td>3x e2-standard-8</td>
                    <td>$578.88</td>
                    <td>Trieve Services</td>
                  </tr>
                  <tr>
                    <td>100gb Enterprise Plus Cloud SQL</td>
                    <td>$513.90</td>
                    <td>Postgres OLTP Server</td>
                  </tr>
                  <tr>
                    <td>5gb Redis</td>
                    <td>$97.20</td>
                    <td>Redis Cache</td>
                  </tr>
                </tbody>
              </table>
              <p class="mt-0.5 font-semibold">Total: $7,342.24/month.</p>
              <p>
                Most of the cost is from storing the dense text embeddings in
                Qdrant. SPLADE is typically better for search, but the dense
                vectors work significantly better for recommendations. If
                recommendations don't get much usage, we will probably drop the
                dense vectors to decrease costs.
              </p>
            </>
          }
        />
      </div>
      <Footer />
    </main>
  );
};

export const FAQCard = (props: { question: string; answer: JSX.Element }) => {
  const [open, setOpen] = createSignal(true);

  return (
    <div class="w-full text-[#828282] text-wrap break-word leading-[14pt] px-2 flex flex-col space-y-1">
      <h3>
        <button
          class="text-[13pt] sm:text-[12pt] text-black text-wrap cursor-pointer font-semibold flex items-center"
          onClick={() => setOpen((prev) => !prev)}
        >
          <p class="w-3 block">
            <Switch>
              <Match when={open()}>{`- `}</Match>
              <Match when={!open()}>{`+ `} </Match>
            </Switch>
          </p>
          <p>{props.question}</p>
        </button>
      </h3>
      <Show when={open()}>
        <div class="text-[11pt] sm:text-[10pt] text-black text-wrap ml-3 flex flex-col gap-y-1">
          {props.answer}
        </div>
      </Show>
    </div>
  );
};
