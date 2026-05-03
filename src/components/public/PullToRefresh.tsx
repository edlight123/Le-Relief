"use client";

/**
 * PullToRefresh
 * ─────────────
 * Custom pull-to-refresh for the PWA. Browsers disable the native gesture
 * when `display: standalone` is active (and iOS Safari never had it), so we
 * implement our own.
 *
 * Behaviour:
 *   • Only activates on touch devices.
 *   • Only triggers when the page is scrolled to the very top.
 *   • Shows a circular spinner that grows / rotates as the user pulls.
 *   • Past the threshold + release → calls `router.refresh()` (App Router
 *     soft refresh, keeps SW + client state intact).
 *   • Hidden on `md:` and up so it never fights with desktop trackpad scroll.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

const PULL_THRESHOLD = 70; // px before refresh fires
const MAX_PULL = 120; // px clamp for the indicator translation
const RESISTANCE = 0.5; // 1 = 1:1 with finger, <1 = rubber-band

type Phase = "idle" | "pulling" | "refreshing";

export default function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Skip on non-touch (desktop) — saves listeners and avoids weird mouse UX.
    if (!("ontouchstart" in window)) return;

    let startY: number | null = null;
    let active = false;
    let currentPull = 0;
    let isRefreshing = false;

    const isAtTop = () =>
      (window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0) <= 0;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (!isAtTop()) {
        startY = null;
        active = false;
        return;
      }
      startY = e.touches[0]?.clientY ?? null;
      active = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isRefreshing || startY === null) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = y - startY;

      // Only react to downward pulls when at top.
      if (delta <= 0 || !isAtTop()) {
        if (active) {
          active = false;
          currentPull = 0;
          setPull(0);
          setPhase("idle");
        }
        return;
      }

      active = true;
      // preventDefault so the browser doesn't try its own overscroll/elastic.
      // Need passive:false for this to take effect (set on the listener).
      if (e.cancelable) e.preventDefault();

      const eased = Math.min(delta * RESISTANCE, MAX_PULL);
      currentPull = eased;
      setPull(eased);
      setPhase("pulling");
    };

    const onTouchEnd = () => {
      if (isRefreshing) return;
      const triggered = active && currentPull >= PULL_THRESHOLD;
      startY = null;
      active = false;

      if (triggered) {
        isRefreshing = true;
        setPhase("refreshing");
        setPull(PULL_THRESHOLD); // park indicator at threshold while refreshing
        const start = Date.now();
        const MIN_VISIBLE_MS = 600;
        try {
          router.refresh();
        } catch {
          /* no-op */
        }
        const elapsed = Date.now() - start;
        const wait = Math.max(0, MIN_VISIBLE_MS - elapsed);
        window.setTimeout(() => {
          isRefreshing = false;
          currentPull = 0;
          setPull(0);
          setPhase("idle");
        }, wait);
      } else {
        currentPull = 0;
        setPull(0);
        setPhase("idle");
      }
    };

    // touchmove must be non-passive so we can preventDefault().
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [router]);

  const progress = Math.min(pull / PULL_THRESHOLD, 1);
  const visible = pull > 0 || phase === "refreshing";
  const isPulling = phase === "pulling";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center md:hidden"
      style={{
        transform: `translateY(${visible ? Math.min(pull, MAX_PULL) - 40 : -60}px)`,
        transition: isPulling ? "none" : "transform 220ms ease-out",
      }}
    >
      <div
        className="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-background shadow-md"
        style={{
          opacity: visible ? Math.max(0.3, progress) : 0,
        }}
      >
        <RefreshCw
          className={`h-4 w-4 text-primary ${phase === "refreshing" ? "animate-spin" : ""}`}
          style={{
            transform:
              phase === "refreshing" ? undefined : `rotate(${progress * 270}deg)`,
            transition:
              phase === "refreshing" ? undefined : "transform 80ms linear",
          }}
        />
      </div>
    </div>
  );
}
