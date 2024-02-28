import { AiOutlineSearch } from "solid-icons/ai";
import { createSignal } from "solid-js";

export interface HeaderProps {
  search: (query: string) => void;
}

export default function Header(props: HeaderProps) {
  let [timeoutId, setTimeoutId] = createSignal<ReturnType<typeof setTimeout>>();
  const debounce = (fn: Function, ms = 300) => {
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutId());
      setTimeoutId(setTimeout(() => fn.apply(this, args), ms));
    };
  };

  return (
    <header class="flex p-1 items-center bg-orange-500 justify-between">
      <div class="flex items-center">
        <img
          src="https://hn.algolia.com/public/899d76bbc312122ee66aaaff7f933d13.png"
          alt="Hacker News"
          class="w-12 h-12"
        />
        <span class="text-lg ml-3 box-border text-black">Search HN</span>
      </div>
      <div class="flex-grow flex items-center justify-center">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <AiOutlineSearch class="w-7 h-7" />
          </div>
          <input
            type="text"
            id="search"
            class="block w-[80vw] pl-10 py-2 rounded-md bg-gray-50 border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
            placeholder="Search HN stories by title, url or author"
            onInput={(e) =>
              debounce(
                (e: string) => props.search(e),
                200,
              )(e.currentTarget.value)
            }
          />
        </div>
      </div>
    </header>
  );
}
