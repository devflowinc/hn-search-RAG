import { For, createEffect, createSignal, onCleanup } from "solid-js";
import { BsCheck2Circle } from "solid-icons/bs";
import { BiRegularErrorCircle } from "solid-icons/bi";
import { VsClose } from "solid-icons/vs";

export interface ToastDetail {
  type: string;
  message: string;
}

export interface ToastEvent {
  detail: ToastDetail;
}

export const createToast = ({ type, message }: ToastDetail) => {
  console.log("show-toast");
  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: {
        type,
        message,
      },
    })
  );
};

const ShowToast = () => {
  const [toastDetails, setToastDetails] = createSignal<ToastDetail[]>([]);

  createEffect(() => {
    let timeOutId: number;

    const showToastEvent = (event: Event) => {
      const toastEvent = event as unknown as ToastEvent;
      setToastDetails((prev) => prev.concat(toastEvent.detail));

      timeOutId = setTimeout(() => {
        setToastDetails((prev) =>
          prev.filter(
            (prevToastDetail) => prevToastDetail !== toastEvent.detail
          )
        );
      }, 1000);
    };

    window.addEventListener("show-toast", showToastEvent);

    onCleanup(() => {
      clearTimeout(timeOutId);
      window.removeEventListener("show-toast", showToastEvent);
    });
  });

  return (
    <div class="z-100 fixed right-5 top-10 flex flex-col space-y-2 rounded">
      <For each={toastDetails()}>
        {(toastDetail) => (
          <div class="flex w-auto shadow-lg items-center justify-between space-x-4 rounded bg-[#F6F6F0] px-5 py-2 text-center">
            {toastDetail.type === "success" ? (
              <BsCheck2Circle class="text-green-600" size={25} />
            ) : (
              <BiRegularErrorCircle class="text-red-700" size={20} />
            )}
            <p class="text-md">{toastDetail.message}</p>
            <VsClose
              cursor="pointer"
              onClick={() => {
                setToastDetails((prev) =>
                  prev.filter(
                    (prevToastDetail) => prevToastDetail !== toastDetail
                  )
                );
              }}
              size={25}
            />
          </div>
        )}
      </For>
    </div>
  );
};

export default ShowToast;
