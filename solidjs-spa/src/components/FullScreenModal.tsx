import { AiOutlineClose } from "solid-icons/ai";
import { Accessor, onCleanup, onMount, Show } from "solid-js";
import { JSX } from "solid-js/jsx-runtime";
import { Portal } from "solid-js/web";
import {
  Dialog,
  DialogOverlay,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "terracotta";

interface FullScreenModalProps {
  children: JSX.Element;
  show: Accessor<boolean>;
  title?: string;
  setShow: (show: boolean) => void;
  icon?: JSX.Element;
}

export const FullScreenModal = (props: FullScreenModalProps) => {
  onMount(() => {
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && props.show()) {
        props.setShow(false);
      }
    };
    document.addEventListener("keydown", closeOnEscape);

    onCleanup(() => {
      document.removeEventListener("keydown", closeOnEscape);
    });
  });

  return (
    <Portal>
      <Transition
        class="fixed inset-0 z-10 overflow-y-auto"
        appear
        show={props.show()}
      >
        <Dialog
          isOpen
          class="fixed inset-0 z-10 overflow-y-auto"
          onClose={() => props.setShow(false)}
        >
          <div class="flex min-h-screen items-center justify-center px-4">
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <DialogOverlay class="fixed inset-0 bg-neutral-900 bg-opacity-50" />
            </TransitionChild>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span class="inline-block h-screen align-middle" aria-hidden="true">
              &#8203;
            </span>
            <TransitionChild
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel class="my-8 inline-block w-full transform overflow-hidden rounded border border-neutral-100 bg-[#F6F6F0] p-6 text-left align-middle shadow-xl transition-all">
                <div
                  classList={{
                    "flex w-full": true,
                    "justify-between": !!props.title,
                    "justify-end": !props.title,
                  }}
                >
                  <Show when={props.title}>
                    {(title) => (
                      <div class="flex items-center justify-between">
                        <DialogTitle
                          as="h3"
                          class="text-lg font-medium leading-6 text-neutral-900"
                        >
                          {title()}
                        </DialogTitle>
                        <Show when={props.icon}>{props.icon}</Show>
                      </div>
                    )}
                  </Show>
                  <button onClick={() => props.setShow(false)}>
                    <AiOutlineClose class="h-4 w-4 text-neutral-900" />
                  </button>
                </div>
                {props.children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </Portal>
  );
};
