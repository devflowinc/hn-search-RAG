import { FiGithub } from "solid-icons/fi";
import { TiSocialLinkedin } from "solid-icons/ti";
import { createSignal, onMount } from "solid-js";

export const Footer = () => {
  const trieveApiKey = import.meta.env.VITE_TRIEVE_API_KEY as string;
  const trieveBaseURL = import.meta.env.VITE_TRIEVE_API_URL as string;
  const [count, setCount] = createSignal(0);

  function extractLimit(str: string) {
    const match = str.match(/Limit of (\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  onMount(() => {
    void fetch(trieveBaseURL + `/chunk/count`, {
      method: "POST",
      body: JSON.stringify({
        query: "test",
        search_type: "fulltext",
      }),
      headers: {
        "Content-Type": "application/json",
        "TR-Dataset": import.meta.env.VITE_TRIEVE_DATASET_ID as string,
        "X-API-VERSION": "V2",
        Authorization: trieveApiKey,
      },
    })
      .then((response) => {
        if (!response.ok) {
          // If the response is not OK, throw an error with the response
          return response.text().then((text) => {
            throw new Error(text);
          });
        }
        return response.json(); // If response is OK, parse JSON
      })
      .then((data) => {
        // Handle successful response
        console.log("Success:", data);
      })
      .catch((error) => {
        // Handle error
        console.error("Error:", error.message);

        // Try to parse the error message
        const errorMessage = error.message;
        setCount(extractLimit(errorMessage) || 0);
      });
  });
  return (
    <header class="flex py-[2px] px-2 min-h-[24px] items-center justify-center border-t border-[#ff6600]">
      <div class="flex py-4 text-[8pt] items-center flex-wrap justify-center">
        <a
          class="flex items-center hover:underline"
          href="https://github.com/devflowinc/trieve"
        >
          <FiGithub class="h-3 w-3 mr-0.5" /> Star Us
        </a>
        <span class="px-1">|</span>
        <a
          class="flex items-center hover:underline"
          href="https://discord.gg/eBJXXZDB8z"
        >
          Discord
        </a>
        <span class="px-1">|</span>
        <a
          class="flex items-center hover:underline"
          href="https://matrix.to/#/#trieve-general:trieve.ai"
        >
          Matrix
        </a>
        <span class="px-1">|</span>
        <a
          class="flex items-center hover:underline"
          href="mailto:humans@trieve.ai"
        >
          humans@trieve.ai
        </a>
        <span class="px-1">|</span>
        <a href="https://dashboard.trieve.ai" class="hover:underline">
          Get Started with Trieve (1k chunks free)
        </a>
        <span class="px-1">|</span>
        <a href="https://docs.trieve.ai" class="hover:underline">
          Docs
        </a>
        <span class="px-1">|</span>
        <a href="https://x.com/trieveai" class="hover:underline">
          𝕏
        </a>
        <span class="px-1">|</span>
        <a
          href="https://www.linkedin.com/company/trieveai"
          class="hover:underline"
        >
          <TiSocialLinkedin class="h-3 w-3" />
        </a>
        <span class="px-1">|</span>
        <span>{count().toLocaleString()} items in index</span>
      </div>
    </header>
  );
};
