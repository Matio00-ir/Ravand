"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import NextLink from "next/link";
import { Link } from "@/i18n/navigation";

/**
 * Layer 1 of the demo: a guided tour of the public /dashboard preview.
 * No sign-up, sample data only, and it says so. Each screen highlights a
 * few areas in order (elements marked with `data-tour`), then hands off
 * to the next screen; the last step asks for one of the two real next
 * steps — a working demo, or a session with an expert.
 *
 * Dismissal is remembered for the browser session only, so someone who
 * closes it isn't nagged on every screen, and "Resume tour" brings it back.
 */

export const TOUR_PAGES = ["overview", "sales", "crm", "inventory", "finance"] as const;
export type TourPage = (typeof TOUR_PAGES)[number] | "workflow" | "hr" | "analytics";

const PATHS: Record<(typeof TOUR_PAGES)[number], string> = {
  overview: "/dashboard",
  sales: "/dashboard/sales",
  crm: "/dashboard/crm",
  inventory: "/dashboard/inventory",
  finance: "/dashboard/finance",
};

type Step = { target: string; title: string; body: string };

const CLOSED_KEY = "ravand-tour-closed";

function readClosed(): boolean {
  try {
    return window.sessionStorage.getItem(CLOSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeClosed(closed: boolean) {
  try {
    if (closed) window.sessionStorage.setItem(CLOSED_KEY, "1");
    else window.sessionStorage.removeItem(CLOSED_KEY);
  } catch {
    // Storage blocked (private mode etc.) — the tour just reopens per page.
  }
}

export function TourBanner({ onResume, closed }: { onResume: () => void; closed: boolean }) {
  const t = useTranslations("tour.banner");
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span>{t("text")}</span>
      <Link href="/demo" className="text-silver underline decoration-white/20 underline-offset-4 hover:text-offwhite">
        {t("working")}
      </Link>
      <Link href="/demo/expert" className="text-silver underline decoration-white/20 underline-offset-4 hover:text-offwhite">
        {t("expert")}
      </Link>
      {closed ? (
        <button type="button" onClick={onResume} className="text-silver underline decoration-white/20 underline-offset-4 hover:text-offwhite">
          {t("resume")}
        </button>
      ) : null}
    </span>
  );
}

export function useTourState() {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    // Read after mount: sessionStorage doesn't exist during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClosed(readClosed());
  }, []);
  const close = useCallback(() => {
    writeClosed(true);
    setClosed(true);
  }, []);
  const resume = useCallback(() => {
    writeClosed(false);
    setClosed(false);
  }, []);
  return { closed, close, resume };
}

export function TourGuide({ page, onClose }: { page: TourPage; onClose: () => void }) {
  const t = useTranslations("tour");
  const locale = useLocale();
  const prefix = locale === "en" ? "/en" : "";
  const pageIndex = TOUR_PAGES.indexOf(page as (typeof TOUR_PAGES)[number]);
  const steps = (pageIndex >= 0 ? t.raw(`pages.${page}`) : []) as Step[];
  const [index, setIndex] = useState(0);

  const isLastPage = pageIndex === TOUR_PAGES.length - 1;
  // Past the last step only exists on the final screen: the closing card.
  const finished = isLastPage && index >= steps.length;
  const step = finished ? null : steps[Math.min(index, steps.length - 1)];
  const lastStepHere = index >= steps.length - 1;
  const nextPage = pageIndex >= 0 && !isLastPage ? TOUR_PAGES[pageIndex + 1] : null;
  const prevPage = pageIndex > 0 ? TOUR_PAGES[pageIndex - 1] : null;

  // Spotlight the current step's element.
  useEffect(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;
    el.setAttribute("data-tour-active", "");
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    return () => el.removeAttribute("data-tour-active");
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Screens outside the tour sequence (sample-only modules) get no card.
  if (pageIndex < 0) return null;

  const total = TOUR_PAGES.reduce((n, p) => n + (t.raw(`pages.${p}`) as Step[]).length, 0);
  const done = TOUR_PAGES.slice(0, pageIndex).reduce((n, p) => n + (t.raw(`pages.${p}`) as Step[]).length, 0);
  const position = Math.min(done + index + 1, total);

  const navBtn =
    "inline-flex items-center justify-center rounded-[var(--radius-xs)] px-3.5 py-2 text-[12.5px] font-semibold transition-colors duration-[var(--t-base)]";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
      className="fixed bottom-4 z-50 w-[min(24rem,calc(100vw-2rem))] rounded-[var(--radius-md)] border border-line-dark-strong bg-deep-panel p-5 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
      style={{ insetInlineEnd: "1rem" }}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="t-label text-steel">
          {finished ? t("finish.eyebrow") : t("progress", { current: position, total })}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="-m-1.5 grid h-7 w-7 place-items-center rounded-[var(--radius-xs)] text-steel hover:bg-white/[0.05] hover:text-offwhite"
        >
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </button>
      </div>

      {step ? (
        <>
          <h2 id="tour-title" className="t-h4 mt-3 text-offwhite">
            {step.title}
          </h2>
          <p className="t-small mt-2 leading-relaxed text-silver">{step.body}</p>
        </>
      ) : (
        <>
          <h2 id="tour-title" className="t-h4 mt-3 text-offwhite">
            {t("finish.title")}
          </h2>
          <p className="t-small mt-2 leading-relaxed text-silver">{t("finish.body")}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/demo" className={`${navBtn} bg-offwhite text-black hover:bg-white`}>
              {t("finish.working")}
            </Link>
            <Link href="/demo/expert" className={`${navBtn} border border-line-dark-strong text-silver hover:text-offwhite`}>
              {t("finish.expert")}
            </Link>
          </div>
        </>
      )}

      <div className="mt-5 flex items-center justify-between gap-3">
        {index > 0 ? (
          <button type="button" onClick={() => setIndex((i) => i - 1)} className={`${navBtn} text-steel hover:text-silver`}>
            {t("back")}
          </button>
        ) : prevPage ? (
          <NextLink href={`${prefix}${PATHS[prevPage]}`} className={`${navBtn} text-steel hover:text-silver`}>
            {t("back")}
          </NextLink>
        ) : (
          <span />
        )}

        {finished ? null : lastStepHere && nextPage ? (
          <NextLink href={`${prefix}${PATHS[nextPage]}`} className={`${navBtn} bg-offwhite text-black hover:bg-white`}>
            {t("goTo", { screen: t(`screens.${nextPage}`) })}
          </NextLink>
        ) : (
          <button type="button" onClick={() => setIndex((i) => i + 1)} className={`${navBtn} bg-offwhite text-black hover:bg-white`}>
            {lastStepHere ? t("finishCta") : t("next")}
          </button>
        )}
      </div>
    </div>
  );
}
