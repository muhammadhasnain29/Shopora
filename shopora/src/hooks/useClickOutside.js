import { useEffect } from "react";

/**
 * Closes a dropdown / menu when the visitor clicks elsewhere or presses Escape.
 */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handler();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [ref, handler, active]);
}

export default useClickOutside;
