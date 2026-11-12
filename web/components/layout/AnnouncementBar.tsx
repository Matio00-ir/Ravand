"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

type Announcement = { active: boolean; text?: string; text_en?: string; link_url?: string; link_label?: string };

/**
 * A one-line announcement above the masthead, managed from /admin/site.
 * Renders nothing until (and unless) one is switched on.
 */
export function AnnouncementBar() {
  const locale = useLocale();
  const [a, setA] = useState<Announcement | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/site/announcement")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Announcement | null) => {
        if (alive && data?.active) setA(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (!a) return null;
  const text = locale === "en" && a.text_en ? a.text_en : a.text;
  if (!text) return null;

  return (
    <div className="bg-black px-4 py-2 text-center text-[13px] text-offwhite">
      <span>{text}</span>
      {a.link_url ? (
        <a href={a.link_url} className="ms-3 font-semibold underline underline-offset-4 hover:text-white">
          {a.link_label || (locale === "en" ? "Learn more" : "بیشتر")}
        </a>
      ) : null}
    </div>
  );
}
