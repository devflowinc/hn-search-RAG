import {
  BiRegularChat,
  BiRegularCheck,
  BiRegularEdit,
  BiRegularPlus,
  BiRegularTrash,
  BiRegularX,
} from "solid-icons/bi";
import { Accessor, createSignal, For, Setter, Show } from "solid-js";
import { Topic } from "../../types";
import { deleteTopic, saveTitle } from "./api/chat";

export interface SidebarProps {
  topics: Accessor<Topic[]>;
  setTopics: Setter<Topic[]>;
  refetchTopics: () => Promise<void>;
  selectedTopic: Accessor<Topic | undefined>;
  setSelectedTopic: (topic: Topic | undefined) => void;
  setSideBarOpen: Setter<boolean>;
}

export const Sidebar = (props: SidebarProps) => {
  return (
    <div class="absolute z-50 flex h-[90vh] w-screen flex-row dark:text-gray-50 lg:relative lg:w-full">
      <div class="flex w-2/3 flex-col border-r border-neutral-300 bg-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 lg:w-full">
        <div class="flex w-full flex-col space-y-2 px-2 py-2">
          <button
            onClick={() => {
              if (
                props.topics().findIndex((topic) => topic.id === "0") === -1
              ) {
                let newTopic = {
                  id: "0",
                  name: "New Topic",
                  user_id: "",
                  created_at: "",
                  deleted: false,
                  updated_at: "",
                  dataset_id: "",
                };
                props.setTopics([newTopic, ...props.topics()]);
                props.setSelectedTopic(newTopic);
              }
            }}
            class="flex w-full flex-row items-center rounded-md border border-transparent px-3 py-1 hover:border-neutral-300 hover:bg-neutral-100 disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-400 hover:dark:border-neutral-700 dark:hover:bg-neutral-700 hover:dark:bg-neutral-700/50"
          >
            <div class="flex flex-row items-center space-x-2">
              <span class="text-xl">
                <BiRegularPlus class="fill-current" />
              </span>
              <span>New Chat</span>
            </div>
          </button>
        </div>
        <div class="flex w-full flex-col space-y-2 overflow-y-auto overflow-x-hidden px-2 py-2 scrollbar-thin scrollbar-track-neutral-200 scrollbar-thumb-neutral-400 scrollbar-track-rounded-md scrollbar-thumb-rounded-md dark:scrollbar-track-neutral-800 dark:scrollbar-thumb-neutral-600">
          <For each={props.topics()}>
            {(topic) => {
              const [editing, setEditing] = createSignal(false);
              const [topicName, setTopicName] = createSignal(topic.name);

              const submitEditText = async () => {
                saveTitle(topic, topicName()).then(() => {
                  props.topics().find((t) => t.id === topic.id)!.name =
                    topicName();
                  props.refetchTopics();
                });
              };

              return (
                <div
                  classList={{
                    "flex w-full cursor-pointer items-center rounded-md border border-transparent p-2 hover:ring-neutral-200 dark:hover:ring-neutral-400/70 hover:ring":
                      true,
                    "bg-white border-neutral-300 dark:border-neutral-600/70 text-black dark:text-white dark:bg-neutral-700/50":
                      props.selectedTopic()?.id === topic.id,
                  }}
                >
                  <Show when={editing()}>
                    <div class="flex flex-1 items-center justify-between px-2">
                      <input
                        value={topic.name}
                        onInput={(e) => {
                          setTopicName(e.currentTarget.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void submitEditText();
                          }
                        }}
                        class="w-full rounded-md bg-neutral-50 px-2 py-1 dark:bg-neutral-800"
                      />

                      <div class="flex flex-row space-x-1 pl-2 text-2xl">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            void submitEditText();
                          }}
                          class="hover:text-green-500"
                        >
                          <BiRegularCheck />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditing(false);
                          }}
                          class="hover:text-red-500"
                        >
                          <BiRegularX />
                        </button>
                      </div>
                    </div>
                  </Show>
                  <Show when={!editing()}>
                    <div
                      class="flex w-full items-center"
                      onClick={() => {
                        props.setSelectedTopic(topic);
                        props.setSideBarOpen(false);
                      }}
                    >
                      <BiRegularChat class="mr-2 fill-current text-xl" />
                      <p class="line-clamp-1 break-all">{topic.name}</p>
                      <div class="flex-1" />
                      <Show
                        when={
                          topic.id !== "0" &&
                          props.selectedTopic()?.id === topic.id
                        }
                      >
                        <div class="flex flex-row items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              setEditing(true);
                            }}
                            class="text-lg hover:text-blue-500"
                          >
                            <BiRegularEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              void deleteTopic(topic.id);
                              props.setSelectedTopic(
                                props.topics().filter((t) => t.id !== "0")[0]
                              );
                              props.setTopics(
                                props.topics().filter((t) => t.id !== topic.id)
                              );
                            }}
                            class="text-lg hover:text-red-500"
                          >
                            <BiRegularTrash />
                          </button>
                        </div>
                      </Show>
                    </div>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>
        <div class="flex-1" />
      </div>
    </div>
  );
};
