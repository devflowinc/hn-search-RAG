export default function Header() {
  return (
    <header class="flex py-[2px] px-2 min-h-[24px] items-center justify-between bg-[#ff6600]">
      <a class="flex items-center" href="/">
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
      <a href="/analytics" class="pr-1 hover:text-white">
        View Analytics
      </a>
    </header>
  );
}
