import { FiGithub } from "solid-icons/fi";

export const Footer = () => {
  return (
    <header class="flex py-[2px] px-2 min-h-[24px] items-center justify-center border-t border-[#ff6600]">
      <div class="flex py-4 text-[8pt]">
        <a
          class="flex items-center hover:underline"
          href="https://github.com/devflowinc/trieve"
        >
          <FiGithub class="h-3 w-3 mr-0.5" /> Star Us
        </a>
        <span class="px-1">|</span>
        <a href="https://dashboard.trieve.ai" class="hover:underline">
          Get Started with Trieve (1k chunks free)
        </a>
        <span class="px-1">|</span>
        <a href="https://docs.trieve.ai" class="hover:underline">
          API Docs
        </a>
        <span class="px-1">|</span>
        <a href="https://x.com/trieveai" class="hover:underline">
          𝕏
        </a>
      </div>
    </header>
  );
};
