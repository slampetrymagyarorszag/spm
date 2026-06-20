import { useState, useEffect, useRef, useCallback } from "react";
import gsap from "gsap";

export type FanVideo = {
  videoId: string;
  title: string;
  thumbnail?: string;
  url: string;
};

const MAX_VISIBLE = 7;
const HALF = 3;

// Legyező-pozíciók (a középső a 3. slot). Forgatás/skála/eltolás kártyánként.
const FAN_POSITIONS = [
  { rot: -21, scale: 0.7756, x: -26, y: 6.4, zIndex: 1 },
  { rot: -14, scale: 0.8498, x: -19, y: 3.4, zIndex: 2 },
  { rot: -7, scale: 0.9346, x: -10, y: 1.1, zIndex: 3 },
  { rot: 0, scale: 1.0, x: 0, y: 0.0, zIndex: 10 },
  { rot: 7, scale: 0.9346, x: 10, y: 1.1, zIndex: 3 },
  { rot: 14, scale: 0.8498, x: 19, y: 3.4, zIndex: 2 },
  { rot: 21, scale: 0.7756, x: 26, y: 6.4, zIndex: 1 },
];

function getResponsiveMultiplier(width: number) {
  if (width < 480) return 0.34;
  if (width < 640) return 0.46;
  if (width < 768) return 0.58;
  if (width < 1024) return 0.8;
  return 1.0;
}

function getSlotConfig(totalCards: number, slot: number) {
  if (totalCards >= MAX_VISIBLE) return FAN_POSITIONS[slot];
  const center = totalCards >> 1;
  const distance = totalCards > 1 ? (slot - center) / center : 0;
  const absDistance = Math.abs(distance);
  return {
    rot: distance * 21,
    scale: 1.0 - 0.2244 * absDistance * absDistance,
    x: distance * 26,
    y: absDistance * absDistance * 6.4,
    zIndex: 10 - Math.abs(slot - center),
  };
}

type MediaFanLabels = { prev?: string; next?: string; play?: string; close?: string };

export default function MediaFan({ videos, labels }: { videos: FanVideo[]; labels?: MediaFanLabels }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAnimating = useRef(false);
  const hasEntered = useRef(false);
  const directionRef = useRef<"left" | "right" | null>(null);
  const prevVisible = useRef<Set<number>>(new Set());

  const totalCards = videos.length;
  const needsPagination = totalCards > MAX_VISIBLE;
  const [centerIndex, setCenterIndex] = useState(needsPagination ? HALF : totalCards >> 1);
  const [lightbox, setLightbox] = useState<FanVideo | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const getVisibleMap = useCallback(
    (center: number) => {
      const map = new Map<number, number>();
      if (!needsPagination) {
        videos.forEach((_, i) => map.set(i, i));
        return map;
      }
      for (let slot = 0; slot < MAX_VISIBLE; slot++) {
        map.set((((center + slot - HALF) % totalCards) + totalCards) % totalCards, slot);
      }
      return map;
    },
    [totalCards, needsPagination, videos],
  );

  const cycle = useCallback(
    (direction: "left" | "right") => {
      if (isAnimating.current || !needsPagination) return;
      isAnimating.current = true;
      directionRef.current = direction;
      setCenterIndex((prev) =>
        direction === "right" ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards,
      );
    },
    [totalCards, needsPagination],
  );

  useEffect(() => {
    if (reduced) return;
    const container = containerRef.current;
    if (!container || !totalCards) return;

    const cardElements = Array.from(container.querySelectorAll<HTMLElement>(".fan-card"));
    if (!cardElements.length) return;

    const visibleMap = getVisibleMap(centerIndex);
    const previouslyVisible = prevVisible.current;
    const direction = directionRef.current;
    const isFirstMount = !hasEntered.current;
    const multiplier = getResponsiveMultiplier(window.innerWidth);
    const slotCount = needsPagination ? MAX_VISIBLE : totalCards;
    const config = (slot: number) => getSlotConfig(slotCount, slot);

    if (isFirstMount) isAnimating.current = true;

    let completedCount = 0;
    const visibleCount = visibleMap.size;
    const onCardDone = () => {
      if (++completedCount >= visibleCount) {
        isAnimating.current = false;
        if (isFirstMount) hasEntered.current = true;
      }
    };

    cardElements.forEach((card, cardIndex) => {
      const slot = visibleMap.get(cardIndex);
      const wasVisible = previouslyVisible.has(cardIndex);

      if (slot !== undefined) {
        const { x, y, rot, scale, zIndex } = config(slot);
        const target = {
          x: `${x * multiplier}rem`,
          y: `${y}rem`,
          rotation: rot,
          scale,
          opacity: 1,
          zIndex,
        };

        if (isFirstMount) {
          gsap.set(card, { x: 0, y: "9rem", rotation: 0, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 1.15, ease: "elastic.out(1.05,.78)", delay: 0.15 + slot * 0.06, onComplete: onCardDone });
        } else if (!wasVisible) {
          const enterX = direction === "right" ? 34 : -34;
          gsap.set(card, { x: `${enterX}rem`, y: `${y}rem`, rotation: direction === "right" ? 30 : -30, scale: 0.5, opacity: 0 });
          gsap.to(card, { ...target, duration: 0.6, ease: "power2.out", onComplete: onCardDone });
        } else {
          gsap.to(card, { ...target, duration: 0.5, ease: "power2.out", onComplete: onCardDone });
        }
      } else if (wasVisible) {
        const exitX = direction === "right" ? -34 : 34;
        gsap.to(card, { x: `${exitX}rem`, opacity: 0, scale: 0.5, rotation: direction === "right" ? -30 : 30, duration: 0.4, ease: "power2.in", zIndex: 0 });
      } else if (isFirstMount) {
        gsap.set(card, { opacity: 0, scale: 0.3, x: 0, y: 0, zIndex: 0 });
      }
    });

    prevVisible.current = new Set(visibleMap.keys());

    // Hover-interakció: a hoverezett kártya kiemelkedik, a többi enyhén szétnyílik.
    const visibleEntries: { el: HTMLElement; slot: number }[] = [];
    cardElements.forEach((el, i) => {
      const slot = visibleMap.get(i);
      if (slot !== undefined) visibleEntries.push({ el, slot });
    });
    visibleEntries.sort((a, b) => a.slot - b.slot);

    let activeSlot: number | null = null;
    let leaveTimer: ReturnType<typeof setTimeout> | null = null;
    const centerSlot = visibleEntries.length >> 1;

    const updateHoverLayout = (hoveredSlot: number | null) => {
      const mult = getResponsiveMultiplier(window.innerWidth);
      visibleEntries.forEach(({ el, slot }) => {
        const base = config(slot);
        let targetX = base.x * mult;
        let targetY = base.y;
        let targetRot = base.rot;
        let targetScale = base.scale;
        let delay = 0;

        if (hoveredSlot !== null) {
          const distance = Math.abs(slot - hoveredSlot);
          delay = distance * 0.02;
          if (slot === hoveredSlot) {
            targetY -= 2.2;
            targetScale *= 1.08;
            targetRot = 0;
          } else {
            const normalized = centerSlot > 0 ? (slot - centerSlot) / centerSlot : 0;
            const pushStrength = 7 * (1 - Math.abs(normalized)) * (1 + 0.2 * Math.max(0, 3 - distance));
            if (slot < hoveredSlot) {
              targetX -= pushStrength * mult;
              targetRot -= 3 / (distance + 1);
            } else {
              targetX += pushStrength * mult;
              targetRot += 3 / (distance + 1);
            }
          }
        } else {
          delay = Math.abs(slot - centerSlot) * 0.02;
        }

        gsap.to(el, {
          x: `${targetX}rem`, y: `${targetY}rem`, rotation: targetRot, scale: targetScale,
          duration: 0.5, delay, ease: "elastic.out(1,.75)", overwrite: "auto",
        });
        gsap.set(el, { zIndex: hoveredSlot !== null && slot === hoveredSlot ? 20 : base.zIndex });
      });
    };

    const enterHandlers = visibleEntries.map(({ el, slot }) => {
      const handler = () => {
        if (isAnimating.current) return;
        if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
        if (activeSlot !== slot) { activeSlot = slot; updateHoverLayout(slot); }
      };
      el.addEventListener("mouseenter", handler);
      return { el, handler };
    });

    const onMouseLeave = () => {
      if (isAnimating.current) return;
      if (leaveTimer) clearTimeout(leaveTimer);
      leaveTimer = setTimeout(() => { activeSlot = null; updateHoverLayout(null); }, 50);
    };
    container.addEventListener("mouseleave", onMouseLeave);

    const onResize = () => { if (!isAnimating.current) updateHoverLayout(activeSlot); };
    window.addEventListener("resize", onResize);

    return () => {
      enterHandlers.forEach(({ el, handler }) => el.removeEventListener("mouseenter", handler));
      container.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("resize", onResize);
      if (leaveTimer) clearTimeout(leaveTimer);
    };
  }, [centerIndex, totalCards, getVisibleMap, needsPagination, reduced]);

  // Esc zárja a lightboxot.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  if (!totalCards) return null;

  const thumb = (v: FanVideo) => v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`;

  const cardInner = (v: FanVideo, index: number) => (
    <>
      <img src={thumb(v)} loading="lazy" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <span className="pointer-events-none absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-lg transition-transform duration-300 group-hover:scale-110">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 p-3 text-left font-display text-sm leading-tight text-white line-clamp-2">{v.title}</span>
    </>
  );

  // Reduced-motion / hozzáférhető fallback: vízszintesen görgethető kártyasor.
  if (reduced) {
    return (
      <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-4">
        {videos.map((v, i) => (
          <button
            key={v.videoId + i}
            type="button"
            onClick={() => setLightbox(v)}
            aria-label={`${labels?.play ?? 'Lejátszás'}: ${v.title}`}
            className="group relative aspect-video w-72 shrink-0 snap-start overflow-hidden rounded-xl border border-ink/10 shadow-sm"
          >
            {cardInner(v, i)}
          </button>
        ))}
      </div>
    );
  }

  const chevron = (direction: "left" | "right") => (
    <svg className="relative z-[2] h-4 w-4 md:h-5 md:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"} />
    </svg>
  );

  return (
    <section className="relative z-20 flex w-full flex-col items-center">
      <div className="flex w-full max-w-[90rem] items-center justify-center">
        <div ref={containerRef} className="fan-layout relative flex w-full max-w-[80rem] items-center justify-center">
          {videos.map((v, index) => (
            <button
              key={v.videoId + index}
              type="button"
              onClick={() => setLightbox(v)}
              aria-label={`${labels?.play ?? 'Lejátszás'}: ${v.title}`}
              className="fan-card group block cursor-pointer"
            >
              {cardInner(v, index)}
            </button>
          ))}
        </div>
      </div>

      {needsPagination && (
        <div className="z-30 mt-6 flex items-center justify-center gap-4">
          <button type="button" className="fan-arrow" onClick={() => cycle("left")} aria-label={labels?.prev ?? 'Előző'}>{chevron("left")}</button>
          <div className="flex items-center gap-2">
            {videos.map((_, i) => (
              <span key={i} className="rounded-full transition-all duration-300" style={{ width: 8, height: 8, background: i === centerIndex ? "var(--color-accent)" : "rgba(0,0,0,0.15)", transform: i === centerIndex ? "scale(1.3)" : "scale(1)" }} />
            ))}
          </div>
          <button type="button" className="fan-arrow" onClick={() => cycle("right")} aria-label={labels?.next ?? 'Következő'}>{chevron("right")}</button>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.title}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setLightbox(null)} aria-label={labels?.close ?? 'Bezárás'} className="absolute -top-10 right-0 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-2xl">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${lightbox.videoId}?autoplay=1&rel=0`}
                title={lightbox.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
            <p className="mt-3 text-center font-display text-lg text-white">{lightbox.title}</p>
          </div>
        </div>
      )}
    </section>
  );
}
