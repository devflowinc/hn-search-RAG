import { createEffect } from "solid-js";

export const RedirectToSearch = () => {
  createEffect(() => {
    console.log("Redirecting to search page");
    window.location.href = "/";
  });

  return <></>;
};
