import Lenis from "lenis";
import { RefObject, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * Smooth scrolling for the panel's main column.
 *
 * Bound to a wrapper element rather than the window, because that is where this
 * app actually scrolls: the page body never moves, the flex column beside the
 * sidebar does (see MainLayout). Left on its default, Lenis would attach to a
 * window that has no scroll to smooth and appear to do nothing at all.
 *
 * Two choices worth knowing about:
 *
 * - **Touch is left alone.** `syncTouch` stays off, so a phone keeps its native
 *   momentum scrolling. Lenis's touch mode replaces that with an interpolation
 *   that feels close but never quite right, and this panel's users are on
 *   phones. Smoothing is a mouse-wheel nicety here, nothing more.
 *
 * - **Nested scrollers opt out** via `data-lenis-prevent`, which Lenis reads
 *   itself. Anything that scrolls inside the page — the date picker's preset
 *   list, a long stack trace — has to keep its own scroll, or the wheel over it
 *   would move the page behind it instead.
 *
 * Ant Design's modals and dropdowns need nothing: they portal to `document.body`,
 * outside the wrapper, and `eventsTarget` is the wrapper — so their wheel events
 * were never Lenis's to intercept.
 */
export const useSmoothScroll = (
  wrapper: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>
) => {
  const lenis = useRef<Lenis | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!wrapper.current || !content.current) return;

    const instance = new Lenis({
      wrapper: wrapper.current,
      content: content.current,
      // Without this the listener sits on `window` and would smooth the wheel
      // over a modal that is not even inside the scroll container.
      eventsTarget: wrapper.current,
      // Lenis moves the real scroll position — it never transforms the content —
      // so the sticky header goes on sticking. Do not swap this for a
      // transform-based smoother without checking that first.
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.12,
      autoRaf: true,
    });

    lenis.current = instance;
    return () => {
      instance.destroy();
      lenis.current = null;
    };
  }, [wrapper, content]);

  /**
   * A new page starts at the top, immediately.
   *
   * Animating there would show the outgoing page's footer racing past the new
   * page's header, and on a long list the trip takes long enough to read.
   */
  useEffect(() => {
    lenis.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return lenis;
};

export default useSmoothScroll;
