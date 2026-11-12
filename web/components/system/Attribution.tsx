"use client";

import { useEffect, useState } from "react";

/**
 * Lead attribution for the admin panel's marketing report. On landing,
 * any utm_* parameters (or, failing that, an external referrer) are kept
 * for 30 days in this browser — first touch wins, so a later direct
 * visit doesn't erase the campaign that brought someone in. Forms send
 * it along as a hidden `utm` field. Nothing here identifies the person;
 * it's only the campaign tags already in the URL they clicked.
 */

const KEY = "ravand_attribution";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Attribution = { source?: string; medium?: string; campaign?: string; referrer?: string; landing?: string; at: number };

function read(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    return Date.now() - a.at < TTL_MS ? a : null;
  } catch {
    return null;
  }
}

const clip = (s: string | null) => (s ? s.slice(0, 100) : undefined);

/** Stores this visit's tags unless a still-valid first touch exists. Idempotent. */
function capture() {
  if (read()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    let referrer: string | undefined;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.host !== window.location.host) referrer = ref.host;
    } catch {
      // Malformed referrer — ignore.
    }
    const a: Attribution = {
      source: clip(params.get("utm_source")) ?? referrer,
      medium: clip(params.get("utm_medium")) ?? (referrer ? "referral" : undefined),
      campaign: clip(params.get("utm_campaign")),
      referrer,
      landing: window.location.pathname.slice(0, 120),
      at: Date.now(),
    };
    if (a.source || a.campaign) window.localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    // Storage blocked — attribution is best-effort.
  }
}

export function AttributionCapture() {
  useEffect(() => {
    capture();
  }, []);
  return null;
}

/** Hidden form field carrying the stored attribution, if any. */
export function AttributionField() {
  const [value, setValue] = useState("");
  useEffect(() => {
    // Child effects run before the layout's capture, so on the landing
    // page itself this field has to capture first.
    capture();
    const a = read();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (a) setValue(JSON.stringify({ source: a.source, medium: a.medium, campaign: a.campaign, referrer: a.referrer, landing: a.landing }));
  }, []);
  return <input type="hidden" name="utm" value={value} />;
}
