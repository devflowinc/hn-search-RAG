import {
  For,
  Setter,
  Show,
  Switch,
  createEffect,
  createSignal,
  Match,
  Accessor,
  on,
} from "solid-js";
import { FiRefreshCcw, FiSend, FiStopCircle } from "solid-icons/fi";

import { HiOutlineAdjustmentsHorizontal } from "solid-icons/hi";
import {
  Message,
  Topic,
  isMessageArray,
  messageRoleFromIndex,
} from "../../types";
import { AfMessage } from "./components/AfMessage";
import { Filters, FilterModal } from "./components/FilterModal";
import {
  createTopic,
  editMessage,
  fetchCompletion,
  fetchMessages,
} from "./api/chat";
import { createStore } from "solid-js/store";
import FingerprintJs from "@fingerprintjs/fingerprintjs";
import { Popover, PopoverPanel, PopoverButton } from "terracotta";

export interface LayoutProps {
  setTopics: Setter<Topic[]>;
  setSelectedTopic: Setter<Topic | undefined>;
  selectedTopic: Accessor<Topic | undefined>;
  setLoadingNewTopic: Setter<boolean>;
}

const getFiltersFromStorage = (topic_id: string) => {
  const filters = window.localStorage.getItem(`filters-${topic_id}`);
  if (!filters) {
    return undefined;
  }
  const parsedFilters = JSON.parse(filters) as unknown as Filters;

  return parsedFilters;
};

export interface ChatSettings {
  concatUserMessagesQuery: boolean;
  pageSize: number;
  searchQuery: string;
  minScore: number;
  systemPrompt: string;
}

const MainLayout = (props: LayoutProps) => {
  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
    setNewMessageContent(textarea.value);
  };

  const [messages, setMessages] = createSignal<Message[]>([]);
  const [newMessageContent, setNewMessageContent] = createSignal<string>("");
  const [streamingCompletion, setStreamingCompletion] =
    createSignal<boolean>(false);
  const [completionAbortController, setCompletionAbortController] =
    createSignal<AbortController>(new AbortController());
  const [showFilterModal, setShowFilterModal] = createSignal<boolean>(false);
  const [previousTopicId, setPreviousTopicId] = createSignal<string>("");

  const [chatSettings, setChatSettings] = createStore<ChatSettings>({
    concatUserMessagesQuery: false,
    pageSize: 10,
    searchQuery: "",
    minScore: 0.0,
    systemPrompt: "",
  });

  const createTopicHandler = async (new_message_content: string) => {
    const fpPromise = FingerprintJs.load();
    const fp = await fpPromise;
    const result = await fp.get();
    props.setLoadingNewTopic(true);
    try {
      setPreviousTopicId("0");
      const newTopic = await createTopic(new_message_content, result.visitorId);
      props.setTopics((prev) => [
        newTopic,
        ...prev.filter((topic) => topic.id !== "0"),
      ]);

      props.setSelectedTopic(newTopic);
    } catch (error) {
      setStreamingCompletion(false);
    } finally {
      props.setLoadingNewTopic(false);
    }
  };

  const handleReader = async (
    reader: ReadableStreamDefaultReader<Uint8Array>
  ) => {
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      if (doneReading) {
        done = doneReading;
        setStreamingCompletion(false);
      } else if (value) {
        const decoder = new TextDecoder();
        const newText = decoder.decode(value);

        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          if (!lastMessage) {
            return prev;
          }

          const newMessage = {
            content: lastMessage.content + newText,
          };
          return [...prev.slice(0, prev.length - 1), newMessage];
        });
        setPreviousTopicId(props.selectedTopic()?.id!);
      }
    }
  };

  const deleteLastMessage = () => {
    setMessages((prev): Message[] => {
      const newMessages = [{ content: "" }];
      return [...prev.slice(0, -1), ...newMessages];
    });
  };

  const addNewMessage = (new_message_content: string) => {
    setNewMessageContent("");
    const newMessageTextarea = document.querySelector(
      "#new-message-content-textarea"
    ) as HTMLTextAreaElement | undefined;
    newMessageTextarea && resizeTextarea(newMessageTextarea);

    setMessages((prev) => {
      if (prev.length === 0) {
        return [
          { content: "" },
          { content: new_message_content },
          { content: "" },
        ];
      }
      const newMessages = [{ content: new_message_content }, { content: "" }];
      return [...prev, ...newMessages];
    });
  };

  const fetchCompletionHandler = async ({
    new_message_content,
    topic_id,
    regenerateLastMessage,
  }: {
    new_message_content: string;
    topic_id: string | undefined;
    regenerateLastMessage?: boolean;
  }) => {
    let finalTopicId = topic_id;
    setStreamingCompletion(true);

    if (!finalTopicId || finalTopicId === "0") {
      await createTopicHandler(new_message_content);
      finalTopicId = props.selectedTopic()?.id;
    }

    if (regenerateLastMessage) {
      deleteLastMessage();
    } else {
      addNewMessage(new_message_content);
    }

    try {
      const reader = await fetchCompletion(
        {
          filters: getFiltersFromStorage(finalTopicId!),
          concat_user_messages_query: chatSettings.concatUserMessagesQuery,
          page_size: chatSettings.pageSize,
          search_query:
            chatSettings.searchQuery !== ""
              ? chatSettings.searchQuery
              : undefined,
          score_threshold: chatSettings.minScore,
          new_message_content,
          topic_id: finalTopicId,
          system_prompt: chatSettings.systemPrompt,
          regenerateLastMessage,
        },
        completionAbortController().signal
      );

      if (!reader) {
        return;
      }

      await handleReader(reader);
    } catch (e) {
      console.error(e);
    } finally {
      setStreamingCompletion(false);
    }
  };

  const fetchMessagesHandler = async (
    topicId: string | undefined,
    abortController: AbortController
  ) => {
    if (!topicId) {
      return;
    }

    try {
      const data = await fetchMessages(topicId, abortController.signal);
      if (isMessageArray(data)) {
        setMessages(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  createEffect(
    on(props.selectedTopic, () => {
      if (previousTopicId() === "0") {
        return;
      }
      setMessages([]);
      fetchMessagesHandler(props.selectedTopic()?.id!, new AbortController());
    })
  );

  const submitNewMessage = () => {
    const topic_id = props.selectedTopic()?.id;
    if (!topic_id || !newMessageContent() || streamingCompletion()) {
      return;
    }
    void fetchCompletionHandler({
      new_message_content: newMessageContent(),
      topic_id,
    });
  };

  return (
    <>
      <div class="relative flex w-full  flex-col justify-between">
        <div
          class="flex flex-col items-stretch gap-6 px-4 pb-32 pt-4"
          id="topic-messages"
        >
          <For each={messages()}>
            {(message, idx) => {
              return (
                <AfMessage
                  normalChat={false}
                  role={messageRoleFromIndex(idx())}
                  content={message.content}
                  streamingCompletion={streamingCompletion}
                  onEdit={(content: string) => {
                    const newMessage: Message = {
                      content: "",
                    };

                    setMessages((prev) => [
                      ...prev.slice(0, idx() + 1),
                      newMessage,
                    ]);

                    completionAbortController().abort();
                    setCompletionAbortController(new AbortController());

                    const params = {
                      filters: getFiltersFromStorage(
                        props.selectedTopic()?.id!
                      ),
                      concat_user_messages_query:
                        chatSettings.concatUserMessagesQuery,
                      page_size: chatSettings.pageSize,
                      search_query:
                        chatSettings.searchQuery !== ""
                          ? chatSettings.searchQuery
                          : undefined,
                      score_threshold: chatSettings.minScore,
                      system_prompt: chatSettings.systemPrompt,
                      message_sort_order: idx(),
                      topic_id: props.selectedTopic()?.id,
                      new_message_content: content,
                    };

                    editMessage(params, completionAbortController().signal)
                      .then((reader) => {
                        if (!reader) {
                          return;
                        }
                        setStreamingCompletion(true);
                        return handleReader(reader);
                      })
                      .catch((e) => {
                        if (e.name === "AbortError") {
                          console.log("Fetch aborted");
                        } else {
                          console.error("Error editing message: ", e);
                        }
                      })
                      .finally(() => {
                        setStreamingCompletion(false);
                      });
                  }}
                  order={idx()}
                />
              );
            }}
          </For>
        </div>

        <div class=" fixed bottom-[7vh] right-21 flex w-full flex-col items-center space-y-4 bg-gradient-to-b from-transparent via-zinc-200 to-zinc-100 p-4 dark:via-zinc-800 dark:to-zinc-900 lg:w-[68vw]">
          <Show when={messages().length > 0}>
            <div class="flex w-full justify-center">
              <Switch>
                <Match when={!streamingCompletion()}>
                  <button
                    class="flex w-fit items-center justify-center space-x-4 rounded-xl border border-neutral-300/80 bg-neutral-50 px-4 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                    onClick={(e) => {
                      e.preventDefault();
                      const topic_id = props.selectedTopic()?.id;
                      if (!topic_id) {
                        return;
                      }
                      void fetchCompletionHandler({
                        new_message_content: "",
                        topic_id,
                        regenerateLastMessage: true,
                      });
                    }}
                  >
                    <FiRefreshCcw />
                    <p>Regenerate Response</p>
                  </button>
                </Match>
                <Match when={streamingCompletion()}>
                  <button
                    class="flex w-fit items-center justify-center space-x-4 rounded-xl bg-neutral-50 px-4 py-2 text-sm dark:bg-neutral-700 dark:text-white"
                    onClick={() => {
                      completionAbortController().abort();
                      setCompletionAbortController(new AbortController());
                      setStreamingCompletion(false);
                    }}
                  >
                    <FiStopCircle class="h-5 w-5" />
                    <p>Stop Generating</p>
                  </button>
                </Match>
              </Switch>
            </div>
          </Show>
          <div class="flex w-full flex-row items-center space-x-2">
            <Popover
              as="form"
              class="relative flex h-fit max-h-[calc(100vh-32rem)] w-full flex-col items-center overflow-y-auto rounded border border-neutral-300 bg-neutral-50 px-4 py-1 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
              defaultOpen={false}
            >
              <PopoverPanel
                class="mb-1 flex w-full flex-col gap-4 border-b border-b-neutral-300 py-4"
                tabIndex={0}
              >
                <div class="flex flex-col gap-2">
                  <div class="flex w-full items-center gap-x-2">
                    <label for="concat_user_messages">
                      Concatenate User Messages:
                    </label>
                    <input
                      type="checkbox"
                      id="concat_user_messages"
                      class="h-4 w-4 rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-800"
                      checked={chatSettings.concatUserMessagesQuery ?? false}
                      onChange={(e) => {
                        setChatSettings({
                          concatUserMessagesQuery: e.target.checked,
                        });
                      }}
                    />
                  </div>
                  <div class="flex w-full items-center gap-x-2">
                    <label for="page_size">Page Size:</label>
                    <input
                      type="number"
                      id="page_size"
                      class="w-12 rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-700"
                      value={chatSettings.pageSize ?? ""}
                      onChange={(e) => {
                        setChatSettings({ pageSize: parseInt(e.target.value) });
                      }}
                    />
                  </div>
                  <div class="flex w-full items-center gap-x-2">
                    <label for="search_query">Search Query:</label>
                    <input
                      type="text"
                      id="search_query"
                      class="w-3/4 rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-700"
                      value={chatSettings.searchQuery ?? ""}
                      onChange={(e) => {
                        setChatSettings({
                          searchQuery: e.target.value,
                        });
                      }}
                    />
                  </div>
                  <div class="flex w-full items-center gap-x-2">
                    <label for="search_query">Min Score:</label>
                    <input
                      type="text"
                      id="search_query"
                      class="w-12 rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-700"
                      step={"any"}
                      value={chatSettings.minScore ?? ""}
                      onChange={(e) => {
                        setChatSettings({
                          minScore: parseFloat(e.target.value),
                        });
                      }}
                    />
                  </div>
                  <div class="flex w-full items-center gap-x-2">
                    <label for="system_prompt">System Prompt:</label>
                    <input
                      type="text"
                      id="system_prompt"
                      class="w-3/4 rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-900 dark:bg-neutral-700"
                      value={chatSettings.systemPrompt ?? ""}
                      onChange={(e) => {
                        setChatSettings({
                          systemPrompt: e.target.value,
                        });
                      }}
                    />
                  </div>
                </div>
                <FilterModal
                  topic_id={props.selectedTopic()?.id!}
                  setShowFilterModal={setShowFilterModal}
                  showFilterModal={showFilterModal}
                />
              </PopoverPanel>
              <textarea
                id="new-message-content-textarea"
                class="w-full resize-none whitespace-pre-wrap bg-transparent py-1 scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 scrollbar-track-rounded-md scrollbar-thumb-rounded-md placeholder:text-black/60 focus:outline-none dark:text-white dark:scrollbar-track-neutral-700 dark:scrollbar-thumb-neutral-600 dark:placeholder:text-white/40"
                placeholder="Write a question or prompt for the assistant..."
                value={newMessageContent()}
                disabled={streamingCompletion()}
                onInput={(e) => resizeTextarea(e.target)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    const new_message_content = newMessageContent();
                    if (!new_message_content) {
                      return;
                    }
                    const topic_id = props.selectedTopic()?.id;
                    void fetchCompletionHandler({
                      new_message_content,
                      topic_id,
                    });
                    return;
                  }
                }}
                rows="1"
              />
              <button
                type="submit"
                classList={{
                  "flex h-10 w-10 items-center justify-center absolute right-[30px] bottom-0":
                    true,
                  "text-neutral-400": !newMessageContent(),
                }}
                disabled={!newMessageContent() || streamingCompletion()}
                onClick={(e) => {
                  e.preventDefault();
                  submitNewMessage();
                }}
              >
                <FiSend />
              </button>
              <PopoverButton
                type="button"
                class="absolute bottom-0 right-[0px] flex h-10 w-10 items-center justify-center"
              >
                <HiOutlineAdjustmentsHorizontal />
              </PopoverButton>
            </Popover>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainLayout;
