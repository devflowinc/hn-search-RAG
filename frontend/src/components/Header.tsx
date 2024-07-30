import { FiGithub } from "solid-icons/fi";
import { Setter } from "solid-js";

export interface HeaderProps {
  setQuery: Setter<string>;
}

export default function Header(props: HeaderProps) {
  return (
    <header class="flex py-[2px] px-2 min-h-[24px] items-center justify-between bg-[#ff6600]">
      <div class="flex">
        <a
          class="flex items-center"
          href="/"
          onClick={() => props.setQuery("")}
        >
          <span class="pr-2">
            <img
              src="https://cdn.trieve.ai/trieve-logo.png"
              alt="Trieve Logo"
              class="w-[18px] h-[18px] border border-white"
            />
          </span>
          <div class="text-wrap">
            <span class="font-bold mr-[5px]">Trieve HN Search</span>
          </div>
        </a>
      </div>
      <div class="flex items-center flex-wrap">
        <a href="/" class="pr-1 hover:text-white hover:underline">
          Search
        </a>
        <span class="pr-1">|</span>
        <a href="/chat" class="pr-1 hover:text-white hover:underline">
          RAG Chat
        </a>
        <span class="pr-1">|</span>
        <a href="/analytics" class="pr-1 hover:text-white hover:underline">
          Analytics
        </a>
        <span class="pr-1">|</span>
        <a
          class="flex items-center hover:text-white hover:underline"
          href="https://github.com/devflowinc/trieve"
        >
          <FiGithub class="h-3 w-3 mr-0.5" /> Star Us
        </a>
      </div>
    </header>
  );
}
