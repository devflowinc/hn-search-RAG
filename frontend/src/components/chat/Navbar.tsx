import {
  BiRegularMenuAltLeft,
  BiRegularEdit,
  BiRegularCheck,
  BiRegularX,
} from "solid-icons/bi";
import {
  Setter,
  Switch,
  Match,
  createSignal,
  Show,
  createEffect,
} from "solid-js";
import { Topic } from "../../types";
import { saveTitle } from "./api/chat";

export interface NavbarProps {
  setSideBarOpen: Setter<boolean>;
  selectedTopic: () => Topic | undefined;
  loadingNewTopic: boolean;
  topics: () => Topic[];
}

export const Navbar = (props: NavbarProps) => {
  const [editing, setEditing] = createSignal(false);
  const [editedContent, setEditedContent] = createSignal(
    props.selectedTopic()?.name ?? "",
  );
  const [previousTopicId, setPreviousTopicId] = createSignal<
    string | undefined
  >(undefined);

  const editTitle = () => {
    setEditing(true);
    setEditedContent(props.selectedTopic()?.name ?? "");
  };

  const saveTitleHandler = () => {
    if (!props.selectedTopic()) return;
    saveTitle(props.selectedTopic()!, editedContent()).then(() => {
      setEditing(false);
    });
  };

  createEffect(() => {
    const selectedTopic = props.selectedTopic();
    if (selectedTopic?.id !== previousTopicId()) {
      setEditing(false);
      setEditedContent("");
      setPreviousTopicId(selectedTopic?.id);
    }
  });

  return (
    <div class="flex w-full items-center justify-between border-b border-neutral-300 bg-neutral-200/80 px-5 py-3 font-semibold text-neutral-800 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-white md:text-xl">
      <div class="lg:hidden">
        <BiRegularMenuAltLeft
          onClick={() => props.setSideBarOpen((prev) => !prev)}
          class="fill-current text-4xl"
        />
      </div>
      <Switch>
        <Match when={props.loadingNewTopic}>
          <div class="flex w-full items-center justify-center px-2 text-center text-base">
            <p>Loading...</p>
          </div>
        </Match>
        <Match when={!props.loadingNewTopic}>
          <div class="flex min-h-8 w-full items-center justify-center px-2 text-center text-base">
            <Show
              when={editing()}
              fallback={
                <div class="flex flex-row items-center justify-center">
                  <p class="mr-2">
                    {props.selectedTopic()?.name ?? "New RAG Chat"}
                  </p>
                  <Show
                    when={
                      props.selectedTopic() && props.selectedTopic()?.id != "0"
                    }
                  >
                    <BiRegularEdit onClick={editTitle} />
                  </Show>
                </div>
              }
            >
              <div class="flex flex-row items-center justify-center gap-x-1.5">
                <input
                  type="text"
                  value={editedContent()}
                  maxlength="150"
                  onInput={(e) => setEditedContent(e.currentTarget.value)}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") saveTitleHandler();
                  }}
                  class="rounded-md border border-neutral-300 px-2 text-sm dark:bg-neutral-800"
                />
                <button onClick={saveTitleHandler}>
                  <BiRegularCheck class="hover:text-green-500" />
                </button>
                <button onClick={() => setEditing(false)}>
                  <BiRegularX class="hover:text-red-500" />
                </button>
              </div>
            </Show>
          </div>
        </Match>
      </Switch>
    </div>
  );
};
