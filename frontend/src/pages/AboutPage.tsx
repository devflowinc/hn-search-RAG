import { createSignal, JSX, Match, Show, Switch } from "solid-js";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import { FiLinkedin } from "solid-icons/fi";
import { BiRegularChevronDown, BiRegularChevronUp } from "solid-icons/bi";

export const HowToUse = () => {
  return (
    <FAQCard
      question="Using the search modes"
      answer={
        <>
          <p>
            There aren't specific strings of words (AKA search queries) which
            you should use for fulltext and not semantic search. Really, it's
            about the type of results you want to see. Here's an explanation of
            what the search index will do in different modes with a query like
            "React vs. SolidJS":
          </p>
          <div class="flex flex-col gap-y-2 pl-2">
            <p>
              -{" "}
              <u>
                <b>Fulltext</b>:
              </u>{" "}
              There are 6 tokens in the query: "React", "vs.", "JS", "Solid",
              and "SolidJS". Fulltext is powered by a neural net called SPLADE
              which will rank these tokens by importance in the order:
              "SolidJS", "React", "vs.", "Solid", "JS". It will then return
              results which have tokens biasing towards the front of the list.
              It understands that you want documents with "SolidJS" and "React",
              but it doesn't understand that you specifically want results
              comparing them. Therefore, it may return documents mentioning
              "React" and "SolidJS" in random, seemingly unrelated contexts.
            </p>
            <p>
              -{" "}
              <u>
                <b>Semantic</b>:
              </u>{" "}
              In this mode, the query "React vs. SolidJS" will be transformed
              into a vector (array of floating point numbers) which represents
              the meaning of the query. The search index will then return
              documents which are closest to this vector. The vector will
              reflect that you want documents about comparing "React" and
              "SolidJS", but also comparisons and JS frameworks in general.
              Understandably, the search results may rank documents comparing
              "Vue" and "Angular" higher than a doc talking about "SolidJS
              performance".
            </p>
            <p>
              -{" "}
              <u>
                <b>Hybrid</b>
              </u>{" "}
              search performs both a fulltext and semantic search then ranks the
              results with a cross-encoder (bge-large-en re-reranker) to merge
              them. Usually, it's the best of both words, but it can take 500+ms
              to return results and is therefore not the default search method.
            </p>
            <p>
              -{" "}
              <u>
                <b>Keyword</b>
              </u>{" "}
              search uses BM25 scoring and takes the tokens for the query:
              React", "vs.", "JS", "Solid", and "SolidJS" then returns results
              which have the most present. There is some bias towards tokens
              which are less present in the dataset overall, but no
              understanding of the meaning of the query.
            </p>
            <p>
              - Click on the advanced button for low-level control over ranking,
              highlights, and more. Check out our{" "}
              <a
                class="underline"
                href="https://docs.trieve.ai/api-reference/chunk/search"
                target="_blank"
              >
                API Docs for the search endpoint
              </a>{" "}
              for more information.
            </p>
          </div>
        </>
      }
    />
  );
};

export const WhyMakeThis = () => {
  return (
    <FAQCard
      question="Why Make This?"
      answer={
        <>
          <p>
            1. Dense vector semantic search, re-rankers, SPLADE, and other
            techniques have gotten a lot of hype recently, but it's hard to
            figure out where each technique is best applied. We're hackers and
            built hacker'y features into Trieve to make it easier to test and
            experiment with this new tech, and needed a dataset us and our
            friends would have knowledge of to mess with. We're hoping to build
            lots of cool shareable projects on top of this demo to learn and
            collect feedback with.
          </p>
          <p>
            2. Make HN search more explorable with recommendations plus RAG and
            more open with public analytics. We added a feedback button under
            the search bar and are collecting CTR data such that we can
            continously fine-tune our models to improve the search experience.
            If you have some time, try out our{" "}
            <a class="underline" href="https://hn-comparison.trieve.ai">
              blind comparison at hn-comparison.trieve.ai
            </a>{" "}
            to help us collect higher quality training data.
          </p>
          <p>
            3. Open up a more fully-featured discovery API for others who want
            to build on top of HN data. The firebase HN API is great, but
            storing all the data yourself is expensive and time-consuming. We
            are hoping to lower that barrier in the old{" "}
            <a
              class="underline"
              href="https://news.ycombinator.com/item?id=2619892"
            >
              Octopart HNSearch spirit
            </a>
            .
          </p>
          <p>
            4. Show what's possible with Trieve, work out scaling/stability
            bugs, and pressure test.
          </p>
          <p>
            5. HN is a cool place where we like to spend time and showing what
            we are working on to this community we feel apart is something we're
            excited about!
          </p>
        </>
      }
    />
  );
};

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
                RAG, and analytics offered via API. We also offer UI's for
                exploring your data and adjusting ranking and relevance.
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
        <HowToUse />
        <WhyMakeThis />
        <FAQCard
          question="How Hard was it to Build This?"
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
                data then 1 more to polish this webapp. It feels awesome to
                finally have this up and running.
              </p>
              <p>
                The painful portion was that unique one-off work was required
                for the frontend and ingest of this demo; it took 100+ commits.
                The AI Chat RAG bit could be higher quality, but for now we just
                copied the code from our RAG playground at{" "}
                <a class="underline" href="https://chat.trieve.ai">
                  chat.trieve.ai
                </a>
                .
              </p>
              <p>
                We punted on some frontend for CTR analytics, advanced
                recommendations, and the "Add to AI Context" functionality
                similar to what Exa offers due to time bounds. We'll add those
                features if this demo gets traction and people use it.
              </p>
              <p>
                Tons of respect to the Algolia folks for building such a great
                building HN search experience and maintaining it for over a
                decade. It's not easy.
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
                vectors work significantly better for recommendations and are
                cool to show functionality of. If recommendations don't get much
                usage, we will probably drop the dense vectors to decrease
                costs.
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

export const AdvancedSearchSyntax = () => {
  return (
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
              Use <code>-</code> to ensure a word won't appear in the result set{" "}
              <code>search -optimization</code>,
            </li>
            <li>
              Use <code>author:USERNAME</code> or <code>by:USERNAME</code> to
              only show results from a particular author(s),
            </li>
            <li>
              Use <code>author:-USERNAME</code> or <code>by:-USERNAME</code> to
              exclude particular author(s),
            </li>
            <li>
              Use <code>site:WEBSITE</code> to only show results from a
              particular website(s),
            </li>
            <li>
              Use <code>site:-WEBSITE</code> to exclude particular website(s),
            </li>
            <li>
              Use <code>story:ID</code> to filter by story ID,
            </li>
            <li>
              Use <code>points&gt;NUMBER</code> or <code>points&lt;NUMBER</code>{" "}
              to filter by points,
            </li>
            <li>
              Use <code>comments&gt;NUMBER</code> or{" "}
              <code>comments&lt;NUMBER</code> to filter by number of comments,
            </li>
            <li>
              While boolean search is not directly supported, you can use
              keyword search (all terms OR'd together with BM25 scoring)
              combined with the <code>"</code> operator to AND certain terms.
            </li>
          </ul>
        </>
      }
    />
  );
};

export const HelpPage = () => {
  return (
    <main class="mx-auto bg-[#F6F6F0] font-verdana text-[13.33px] sm:bg-hn md:m-2 md:mx-auto md:w-[85%]">
      <Header />
      <div class="my-6 flex flex-col gap-y-5">
        <AdvancedSearchSyntax />
        <HowToUse />
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
      <h3 class="mb-1">
        <button
          class="flex cursor-pointer items-center text-wrap text-[13pt] font-semibold text-black sm:text-[12pt]"
          onClick={() => setOpen((prev) => !prev)}
        >
          <p class="mr-2 block w-3">
            <Switch>
              <Match when={open()}>
                <BiRegularChevronUp />
              </Match>
              <Match when={!open()}>
                <BiRegularChevronDown />
              </Match>
            </Switch>
          </p>
          <p>{props.question}</p>
        </button>
      </h3>
      <Show when={open()}>
        <div class="ml-3 flex flex-col gap-y-[6px] text-wrap text-[11pt] text-black sm:text-[10pt]">
          {props.answer}
        </div>
      </Show>
    </div>
  );
};
