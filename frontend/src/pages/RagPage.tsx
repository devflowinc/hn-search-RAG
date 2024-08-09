import { createSignal, createEffect, Show } from "solid-js";
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Topic } from "../types";
import { getTopics } from "../components/chat/api/chat";
import { Navbar } from "../components/chat/Navbar";
import { Sidebar } from "../components/chat/Sidebar";
import MainLayout from "../components/chat/MainLayout";

export const RagPage = () => {
  const [selectedTopic, setSelectedTopic] = createSignal<Topic | undefined>(
    undefined,
  );
  const [sidebarOpen, setSideBarOpen] = createSignal<boolean>(true);
  const [topics, setTopics] = createSignal<Topic[]>([]);
  const [loadingNewTopic, setLoadingNewTopic] = createSignal<boolean>(false);

  const fpPromise = FingerprintJS.load();

  createEffect(() => {
    refetchTopics();
  });

  const refetchTopics = async () => {
    setLoadingNewTopic(true);
    const fp = await fpPromise;
    const result = await fp.get();
    const results = await getTopics(result.visitorId);
    setTopics(results);
    setLoadingNewTopic(false);
  };

  return (
    <main class="mx-auto bg-[#F6F6F0] font-verdana text-[13.33px] sm:bg-hn md:m-2 md:mx-auto md:w-[85%]">
      <Header />
      <div class="relative flex max-h-[90vh] flex-row bg-zinc-100 dark:bg-zinc-900">
        <div class="hidden w-1/4 overflow-x-hidden lg:block">
          <Sidebar
            selectedTopic={selectedTopic}
            refetchTopics={refetchTopics}
            setSelectedTopic={setSelectedTopic}
            topics={topics}
            setTopics={setTopics}
            setSideBarOpen={setSideBarOpen}
          />
        </div>
        <div class="lg:hidden">
          <Show when={sidebarOpen()}>
            <Sidebar
              selectedTopic={selectedTopic}
              refetchTopics={refetchTopics}
              setSelectedTopic={setSelectedTopic}
              topics={topics}
              setTopics={setTopics}
              setSideBarOpen={setSideBarOpen}
            />
          </Show>
        </div>
        <div
          id="topic-layout"
          class="max-h-[90vh] w-full overflow-y-auto scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 scrollbar-track-rounded-md scrollbar-thumb-rounded-md dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600"
        >
          <Navbar
            selectedTopic={selectedTopic}
            setSideBarOpen={setSideBarOpen}
            loadingNewTopic={loadingNewTopic()}
            topics={topics}
          />
          <MainLayout
            setTopics={setTopics}
            setSelectedTopic={setSelectedTopic}
            selectedTopic={selectedTopic}
            setLoadingNewTopic={setLoadingNewTopic}
          />
        </div>
      </div>
      <Footer />
    </main>
  );
};
