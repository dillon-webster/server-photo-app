export function createOpenClickRef(onOpen: () => void) {
  let unbind: (() => void) | undefined;

  return (target: EventTarget | null) => {
    unbind?.();
    unbind = undefined;

    if (target) {
      target.addEventListener("click", onOpen);
      unbind = () => target.removeEventListener("click", onOpen);
    }
  };
}
