import { createSignal, JSX, Match, Show, Switch } from "solid-js";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import { FiLinkedin } from "solid-icons/fi";

export const AboutPage = () => {
  return (
    <main class="mx-auto bg-[#F6F6F0] font-verdana text-[13.33px] sm:bg-hn md:m-2 md:mx-auto md:w-[85%]">
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
                The RAG bit could be higher quality, but for now we just copied
                the code from our RAG playground at{" "}
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
                    <th class="text-left">vCPUs/ RAM (GB)</th>
                    <th class="text-left">Cost/Month</th>
                    <th class="text-left">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1x g2-standard-4</td>
                    <td>32cpu 256GB + T4 GPU</td>
                    <td>$508.90</td>
                    <td>Text-Embeddings-Inference Servers</td>
                  </tr>
                  <tr>
                    <td>4x c2d-highmem-32</td>
                    <td>32cpu 256GB</td>
                    <td>$5,643.36</td>
                    <td>4 node Qdrant Cluster (2x Replication)</td>
                  </tr>
                  <tr>
                    <td>1x e2-highcpu-4</td>
                    <td>4cpu 4GB</td>
                    <td>$72.23</td>
                    <td>Trieve Services</td>
                  </tr>
                  <tr>
                    <td>100gb Enterprise Plus Cloud SQL</td>
                    <td>2cpu 16GB</td>
                    <td>$513.90</td>
                    <td>Postgres OLTP Server</td>
                  </tr>
                  <tr>
                    <td>5gb Redis</td>
                    <td>2cpu 16GB</td>
                    <td>$97.20</td>
                    <td>Redis Cache</td>
                  </tr>
                </tbody>
              </table>
              <p class="mt-0.5 font-semibold">Total: $6835.39/month.</p>
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
        <FAQCard
          question="Contact Us"
          answer={
            <>
              <p>
                Email:{" "}
                <a class="underline" href="mailto:humans@trieve.ai">
                  humans@trieve.ai
                </a>
              </p>
              <p>
                𝕏:{" "}
                <a class="underline" href="https://x.com/trieveai">
                  @trieveai
                </a>
              </p>
              <p>
                <FiLinkedin class="inline-block h-4 w-4" />:{" "}
                <a
                  class="underline"
                  href="https://www.linkedin.com/company/trieveai"
                >
                  linkedin.com/company/trieveai
                </a>
              </p>
              <p>
                Discord:{" "}
                <a class="underline" href="https://discord.gg/eBJXXZDB8z">
                  discord.gg/eBJXXZDB8z
                </a>
              </p>
              <p>
                Matrix:{" "}
                <a
                  class="underline"
                  href="https://matrix.to/#/#trieve-general:trieve.ai"
                >
                  matrix.to/#/#trieve-general:trieve.ai
                </a>
              </p>
            </>
          }
        />
      </div>
      <Footer />
    </main>
  );
};

export const HelpPage = () => {
  return (
    <main class="mx-auto bg-[#F6F6F0] font-verdana text-[13.33px] sm:bg-hn md:m-2 md:mx-auto md:w-[85%]">
      <Header />
      <div class="my-6 flex flex-col gap-y-5">
        <FAQCard
          question="Advanced search syntax"
          answer={
            <>
              <ul>
                <li>
                  Use <code>"</code> to match a particular sequence of terms{" "}
                  <code>"search engine"</code>
                </li>
                <li>
                  Use <code>-</code> to ensure a word won't appear in the result
                  set <code>search -optimization</code>,
                </li>
                <li>
                  Use <code>author:USERNAME</code> or <code>by:USERNAME</code>{" "}
                  to filter by author,
                </li>
                <li>
                  Use <code>story:ID</code> to filter by story,
                </li>
                <li>
                  Use <code>points&gt;NUMBER</code> or{" "}
                  <code>points&lt;NUMBER</code> to filter by points,
                </li>
                <li>
                  Use <code>comments&gt;NUMBER</code> or{" "}
                  <code>comments&lt;NUMBER</code> to filter by number of
                  comments,
                </li>
              </ul>
            </>
          }
        />
        <FAQCard
          question="Contact Us"
          answer={
            <>
              <p>
                Email:{" "}
                <a class="underline" href="mailto:humans@trieve.ai">
                  humans@trieve.ai
                </a>
              </p>
              <p>
                𝕏:{" "}
                <a class="underline" href="https://x.com/trieveai">
                  @trieveai
                </a>
              </p>
              <p>
                <FiLinkedin class="inline-block h-4 w-4" />:{" "}
                <a
                  class="underline"
                  href="https://www.linkedin.com/company/trieveai"
                >
                  linkedin.com/company/trieveai
                </a>
              </p>
              <p>
                Discord:{" "}
                <a class="underline" href="https://discord.gg/eBJXXZDB8z">
                  discord.gg/eBJXXZDB8z
                </a>
              </p>
              <p>
                Matrix:{" "}
                <a
                  class="underline"
                  href="https://matrix.to/#/#trieve-general:trieve.ai"
                >
                  matrix.to/#/#trieve-general:trieve.ai
                </a>
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
    <div class="break-word flex w-full flex-col space-y-1 text-wrap px-2 leading-[14pt] text-[#828282]">
      <h3>
        <button
          class="flex cursor-pointer items-center text-wrap text-[13pt] font-semibold text-black sm:text-[12pt]"
          onClick={() => setOpen((prev) => !prev)}
        >
          <p class="block w-3">
            <Switch>
              <Match when={open()}>{`- `}</Match>
              <Match when={!open()}>{`+ `} </Match>
            </Switch>
          </p>
          <p>{props.question}</p>
        </button>
      </h3>
      <Show when={open()}>
        <div class="ml-3 flex flex-col gap-y-1 text-wrap text-[11pt] text-black sm:text-[10pt]">
          {props.answer}
        </div>
      </Show>
    </div>
  );
};
