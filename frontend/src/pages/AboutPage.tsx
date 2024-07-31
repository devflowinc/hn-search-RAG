import { createSignal, Match, Show, Switch } from "solid-js";
import { Footer } from "../components/Footer";
import Header from "../components/Header";

export const AboutPage = () => {
  return (
    <main class="bg-[#F6F6F0] sm:bg-hn font-verdana md:m-2 md:w-[85%] mx-auto md:mx-auto text-[13.33px]">
      <Header />
      <div class="my-8">
        <FAQCard
          question="How Much Does it Cost to Run This Per Month?"
          answer="Will be updated soon."
        />
      </div>
      <Footer />
    </main>
  );
};

export const FAQCard = (props: { question: string; answer: string }) => {
  const [open, setOpen] = createSignal(true);

  return (
    <div class="w-full mb-[-6px] text-[#828282] text-wrap break-word leading-[14pt] mt-8 px-2 flex flex-col space-y-1">
      <h3>
        <button
          class="text-[13pt] sm:text-[12pt] text-black text-wrap cursor-pointer font-semibold"
          onClick={() => setOpen((prev) => !prev)}
        >
          <Switch>
            <Match when={open()}>{`- `}</Match>
            <Match when={!open()}>{`+ `} </Match>
          </Switch>

          {props.question}
        </button>
      </h3>
      <Show when={open()}>
        <p class="text-[11pt] sm:text-[10pt] text-black text-wrap">
          {props.answer}
        </p>
      </Show>
    </div>
  );
};
