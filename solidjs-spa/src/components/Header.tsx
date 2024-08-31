import { FiGithub } from "solid-icons/fi";
import { Setter } from "solid-js";
import ShowToast from "./ShowToast";

export interface HeaderProps {
  setQuery?: Setter<string>;
}

export default function Header(props: HeaderProps) {
  return (
    <header class="flex min-h-[24px] items-center justify-between bg-[#ff6600] px-2 py-[2px]">
      <div class="flex">
        <a
          class="flex items-center"
          href="/"
          onClick={() => props.setQuery?.("")}
        >
          <span class="pr-2">
            <img
              src="https://cdn.trieve.ai/trieve-logo.png"
              alt="Trieve Logo"
              class="h-[18px] w-[18px] border border-white"
            />
          </span>
          <div class="text-wrap">
            <span class="mr-[5px] font-bold">Trieve HN Discovery</span>
          </div>
        </a>
      </div>
      <div class="flex flex-wrap items-center">
        <a href="/" class="pr-1 hover:text-white hover:underline">
          Search
        </a>
        <span class="pr-1">|</span>
        <a href="/chat" class="pr-1 hover:text-white hover:underline">
          AI Chat
        </a>
        <span class="pr-1">|</span>
        <a href="/analytics" class="pr-1 hover:text-white hover:underline">
          Analytics
        </a>
        <span class="pr-1">|</span>
        <a href="/about" class="pr-1 hover:text-white hover:underline">
          About
        </a>
        <span class="pr-1">|</span>
        <a href="/help" class="pr-1 hover:text-white hover:underline">
          Help
        </a>
        <span class="pr-1">|</span>
        <a
          href="https://news.ycombinator.com/"
          class="pr-1 hover:text-white hover:underline"
        >
          Front Page
        </a>
        <span class="pr-1">|</span>
        <a
          class="flex items-center hover:text-white hover:underline"
          href="https://github.com/devflowinc/trieve"
        >
          <FiGithub class="mr-0.5 h-3 w-3" /> Star Us
        </a>
      </div>
      <ShowToast />
    </header>
  );
}
