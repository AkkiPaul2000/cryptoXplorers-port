import { useEffect, useRef } from "react";

export function useAbortableEffect(effect, deps) {
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();

    effect(controller.signal, () => alive.current);

    return () => {
      alive.current = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
