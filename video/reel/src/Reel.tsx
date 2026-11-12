import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, staticFile, useVideoConfig } from "remotion";
import { Backdrop, C, Lockup, Panel, Plane, Symbol, en, fa, faDigits, faNum, prog, useSec } from "./brand";
import { Captions } from "./Captions";
import A from "./timeline-A.json";
import B from "./timeline-B.json";
import Cc from "./timeline-C.json";

export type Variant = "A" | "B" | "C";
export const TIMELINES = { A, B, C: Cc } as const;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const center: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" };

/** Short camera shake that decays — used on impacts only. */
const shake = (t: number, t0: number, amp = 14) => {
  const k = t - t0;
  if (k < 0 || k > 0.35) return "translate(0,0)";
  const a = amp * Math.exp(-k * 12);
  return `translate(${Math.sin(k * 90) * a}px, ${Math.cos(k * 70) * a}px)`;
};

const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = C.muted, size = 36, style }) => (
  <div style={{ fontFamily: fa, fontWeight: 500, fontSize: size, color, ...style }}>{children}</div>
);

// ---------------------------------------------------------------- hooks
const MoneyLeak: React.FC<{ t: number; appear?: number }> = ({ t, appear = 1 }) => {
  const value = 48_200_000 + Math.floor(t * 2_417_000 + Math.sin(t * 7) * 90_000);
  const pulse = 0.55 + 0.45 * Math.sin(t * 6);
  return (
    <AbsoluteFill style={{ ...center, opacity: appear }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 36%, rgba(239,68,68,${0.16 * pulse}) 0, transparent 55%)` }} />
      <div style={{ ...center, position: "absolute", top: 330, left: 0, right: 0, transform: `scale(${1 + t * 0.012})` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 16, height: 16, borderRadius: 8, background: C.error, opacity: pulse }} />
          <Label color={C.silver} size={40}>زیانِ پنهانِ امروز</Label>
        </div>
        <div style={{ fontFamily: fa, fontWeight: 700, fontSize: 124, color: C.error, direction: "ltr",
          fontVariantNumeric: "tabular-nums", letterSpacing: -2, marginTop: 10 }}>
          −{faNum(value)}
        </div>
        <Label color={C.steel} size={42}>تومان</Label>
        <div style={{ display: "flex", gap: 22, marginTop: 70 }}>
          {["فروش", "انبار", "مالی"].map((m, i) => (
            <div key={m} style={{ padding: "14px 30px", border: `1px solid ${C.lineStrong}`, borderRadius: 8,
              fontFamily: fa, fontSize: 34, color: C.silver, background: C.raised }}>
              {m} <span style={{ color: C.error, fontWeight: 600 }}>{i === 1 ? "؟" : "↓"}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SpreadsheetChaos: React.FC<{ t: number }> = ({ t }) => {
  const cols = 6, rows = 16;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 230, left: 40, right: 40, transform: `scale(${1.02 + t * 0.03}) rotate(${-1.5 + t * 0.3}deg)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#1f6f43", padding: "14px 22px", borderRadius: "10px 10px 0 0",
          fontFamily: fa, fontSize: 30, color: "#fff", direction: "rtl" }}>
          <span style={{ fontFamily: en, fontWeight: 700 }}>X</span>
          موجودی_انبار_نهایی_واقعاً‌نهایی(۳).xlsx
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, background: "#f3f4f6", direction: "ltr" }}>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const r = random(`c${i}`);
            const flip = Math.floor(t * 9 + r * 20);
            const err = random(`e${i}-${flip}`) > 0.86;
            const txt = i < cols ? "ABCDEF"[i] : err ? (random(`k${i}`) > 0.5 ? "#REF!" : "؟؟") : faDigits(Math.floor(random(`v${i}-${flip}`) * 9999));
            return (
              <div key={i} style={{ height: 62, border: "1px solid #d1d5db", fontFamily: i < cols ? en : fa, fontSize: 28,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: err ? "#fff" : "#111827", background: err ? C.error : i < cols ? "#e5e7eb" : "#fff",
                fontWeight: i < cols ? 600 : 400 }}>{txt}</div>
            );
          })}
        </div>
      </div>
      <AbsoluteFill style={{ background: "linear-gradient(to bottom, transparent 55%, rgba(11,13,16,.95) 72%)" }} />
    </AbsoluteFill>
  );
};

const ProfitQuestion: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ ...center }}>
    <Panel style={{ position: "absolute", top: 330, width: 860, padding: "44px 56px", direction: "rtl" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label color={C.silver} size={38}>سود خالص امروز</Label>
        <Label color={C.steel} size={30}>در حال محاسبه…</Label>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 30, direction: "ltr", justifyContent: "center" }}>
        {Array.from({ length: 11 }).map((_, i) => (
          <div key={i} style={{ width: i === 3 || i === 7 ? 30 : 60, height: 120, borderRadius: 8, background: C.panel, border: `1px solid ${C.line}`,
            ...center, fontFamily: fa, fontWeight: 700, fontSize: 76, color: C.offwhite, opacity: 0.9 }}>
            {i === 3 || i === 7 ? "٬" : faDigits(Math.floor(random(`d${i}-${Math.floor(t * 14)}`) * 10))}
          </div>
        ))}
      </div>
      <div style={{ height: 6, background: C.panel, borderRadius: 3, marginTop: 34, overflow: "hidden" }}>
        <div style={{ width: `${30 + 40 * Math.abs(Math.sin(t * 2))}%`, height: "100%", background: C.accent }} />
      </div>
    </Panel>
    <div style={{ position: "absolute", top: 760, fontFamily: fa, fontWeight: 700, fontSize: 200, color: C.error,
      transform: `rotate(${Math.sin(t * 4) * 6}deg)` }}>؟</div>
  </AbsoluteFill>
);

// ---------------------------------------------------------------- body scenes
const Progress: React.FC<{ n: number; t: number }> = ({ n, t }) => (
  <div style={{ position: "absolute", top: 210, left: 0, right: 0, ...center, gap: 18, opacity: prog(t, 0, 0.2) }}>
    <Label color={C.muted} size={32}>نشانه {faDigits(n || 0)} از ۳</Label>
    <div style={{ display: "flex", gap: 10, direction: "rtl" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ width: 110, height: 6, borderRadius: 3, background: i <= n ? C.offwhite : C.carbon }} />
      ))}
    </div>
  </div>
);

const Bridge: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={center}>
    <div style={{ position: "absolute", top: 300, ...center, transform: `scale(${1.25 - 0.25 * prog(t, 0, 0.3)})`, opacity: prog(t, 0, 0.15) }}>
      <div style={{ fontFamily: fa, fontWeight: 700, fontSize: 520, color: C.offwhite, lineHeight: 1 }}>۳</div>
      <Label color={C.silver} size={56} style={{ marginTop: -10 }}>نشانه‌ی هشدار</Label>
    </div>
    <div style={{ position: "absolute", top: 1000, display: "flex", gap: 18, direction: "rtl" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: 170, height: 8, borderRadius: 4, background: C.carbon, overflow: "hidden" }}>
          <div style={{ width: `${prog(t, 0.5 + i * 0.35, 0.25) * 100}%`, height: "100%", background: C.error, marginLeft: "auto" }} />
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

const PhoneCall: React.FC<{ t: number }> = ({ t }) => {
  const rings = [0, 0.5, 1].map((o) => ((t + o) % 1.5) / 1.5);
  const bubble = prog(t, 1.9, 0.2);
  return (
    <AbsoluteFill>
      <Progress n={1} t={t} />
      <Panel style={{ position: "absolute", top: 360, left: 150, right: 150, padding: "56px 40px", ...center, gap: 18,
        transform: `translateY(${(1 - prog(t, 0, 0.22)) * 60}px)`, opacity: prog(t, 0, 0.18) }}>
        <div style={{ position: "relative", width: 170, height: 170, ...center }}>
          {rings.map((r, i) => (
            <div key={i} style={{ position: "absolute", width: 170 + r * 160, height: 170 + r * 160, borderRadius: "50%",
              border: `2px solid ${C.accent}`, opacity: (1 - r) * 0.6 }} />
          ))}
          <div style={{ width: 170, height: 170, borderRadius: "50%", background: C.carbon, ...center,
            fontFamily: fa, fontWeight: 700, fontSize: 80, color: C.silver }}>ا</div>
        </div>
        <div style={{ fontFamily: fa, fontWeight: 700, fontSize: 56, color: C.offwhite, marginTop: 30 }}>انباردار</div>
        <Label color={C.muted} size={36}>در حال تماس… {faDigits(`00:${String(Math.floor(t + 3)).padStart(2, "0")}`)}</Label>
        <div style={{ display: "flex", gap: 60, marginTop: 30 }}>
          <div style={{ width: 110, height: 110, borderRadius: "50%", background: C.error, ...center, fontSize: 50, color: "#fff" }}>✕</div>
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 1010, right: 150, maxWidth: 700, padding: "26px 34px", borderRadius: "26px 26px 6px 26px",
        background: C.carbon, fontFamily: fa, fontSize: 40, color: C.offwhite, direction: "rtl",
        opacity: bubble, transform: `scale(${0.85 + 0.15 * bubble})`, transformOrigin: "right bottom" }}>
        «گوشی دستت… برم بشمرم!»
      </div>
    </AbsoluteFill>
  );
};

const CalendarFlip: React.FC<{ t: number }> = ({ t }) => {
  const days = ["۳۰ شهریور", "۱ مهر", "۲ مهر", "۳ مهر", "۴ مهر", "۵ مهر"];
  const i = Math.max(0, Math.min(days.length - 1, Math.floor((t - 0.5) / 0.28) + 1));
  const flip = ((t - 0.5) % 0.28) / 0.28;
  const [d, m] = days[i].split(" ");
  return (
    <AbsoluteFill>
      <Progress n={2} t={t} />
      <Panel style={{ position: "absolute", top: 380, left: 250, right: 250, opacity: prog(t, 0, 0.18) }}>
        <div style={{ height: 70, background: C.error, ...center }}>
          <Label color="#fff" size={34}>{m}</Label>
        </div>
        <div style={{ height: 380, ...center, fontFamily: fa, fontWeight: 700, fontSize: 240, color: C.offwhite,
          transform: t > 0.5 && i < days.length - 1 ? `rotateX(${flip * 40}deg)` : "none" }}>{d}</div>
      </Panel>
      <div style={{ position: "absolute", top: 930, left: 200, right: 200, direction: "rtl" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Label size={34}>بستن حساب‌های ماه…</Label>
          <Label size={34} color={C.silver}>{faDigits(Math.min(87, Math.floor(t * 40)))}٪</Label>
        </div>
        <div style={{ height: 10, background: C.carbon, borderRadius: 5, marginTop: 16, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(87, t * 40)}%`, height: "100%", background: C.warning, marginLeft: "auto" }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Mismatch: React.FC<{ t: number }> = ({ t }) => {
  const neq = prog(t, 1.5, 0.15);
  const card = (label: string, value: string, i: number) => (
    <Panel style={{ width: 800, padding: "34px 46px", direction: "rtl", opacity: prog(t, 0.2 + i * 0.45, 0.2),
      transform: `translateX(${(1 - prog(t, 0.2 + i * 0.45, 0.22)) * (i ? -80 : 80)}px) ${shake(t, 1.5, 10)}` }}>
      <Label color={C.muted} size={36}>{label}</Label>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 8 }}>
        <span style={{ fontFamily: fa, fontWeight: 700, fontSize: 110, color: C.offwhite }}>{value}</span>
        <Label color={C.steel} size={36}>میلیون تومان</Label>
      </div>
    </Panel>
  );
  return (
    <AbsoluteFill>
      <Progress n={3} t={t} />
      <div style={{ position: "absolute", top: 360, left: 0, right: 0, ...center, gap: 30 }}>
        {card("گزارش فروش", "۵۳۸", 0)}
        <div style={{ fontFamily: en, fontWeight: 700, fontSize: 150, lineHeight: 1, color: C.error, opacity: neq, transform: `scale(${1.6 - 0.6 * neq})` }}>≠</div>
        {card("گزارش حسابداری", "۴۹۱", 1)}
      </div>
    </AbsoluteFill>
  );
};

const SOURCES = ["اکسل", "دفتر", "واتساپ", "فایل حسابداری", "کاغذ", "تلگرام", "حافظه‌ی مدیر"];
const SCATTER = [[80, 330, -14], [600, 300, 10], [260, 560, 18], [640, 640, -8], [60, 820, 8], [520, 930, -16], [300, 1080, 12]];
const Fragments: React.FC<{ t: number; snap?: number }> = ({ t, snap = 0 }) => (
  <AbsoluteFill>
    {SOURCES.map((s, i) => {
      const [x, y, r] = SCATTER[i];
      const jitter = t < 0.3 ? (random(`g${i}-${Math.floor(t * 30)}`) - 0.5) * 40 : 0;
      const tx = interpolate(snap, [0, 1], [x + Math.sin(t * 1.3 + i) * 14 + jitter, 380 + i * 8]);
      const ty = interpolate(snap, [0, 1], [y + Math.cos(t * 1.1 + i) * 12, 560 + i * 26]);
      return (
        <Plane key={s} w={360} h={140} color={i % 2 ? C.carbon : C.graphite}
          style={{ left: tx, top: ty, transform: `rotate(${r * (1 - snap)}deg)`, opacity: prog(t, i * 0.06, 0.15) * (1 - snap * 0.9),
            border: `1px solid ${C.line}` }}>
          <span style={{ fontFamily: fa, fontSize: 36, fontWeight: 600, color: C.silver }}>{s}</span>
        </Plane>
      );
    })}
  </AbsoluteFill>
);

const Solution: React.FC<{ t: number; dur: number }> = ({ t }) => {
  const snap = prog(t, 0, 0.35);
  const logo = prog(t, 0.15, 0.4);
  const logoOut = prog(t, 1.15, 0.2);
  const shots = ["finance_v.png", "chart.png", "funnel.png", "docs.png"];
  const idx = Math.floor((t - 1.3) / 0.95);
  return (
    <AbsoluteFill style={{ transform: shake(t, 0, 16) }}>
      <div style={{ opacity: 1 - logoOut }}><Fragments t={3 + t} snap={snap} /></div>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, ...center, opacity: logo * (1 - logoOut),
        transform: `scale(${0.8 + 0.2 * logo + t * 0.04})` }}>
        <Symbol size={340} legT={prog(t, 0.15, 0.35)} ribT={prog(t, 0.3, 0.4)} />
      </div>
      {idx >= 0 && (
        <AbsoluteFill>
          <div style={{ position: "absolute", top: 230, left: 0, right: 0, ...center, opacity: prog(t, 1.3, 0.2) }}>
            <Lockup height={62} />
          </div>
          {(() => {
            const i = Math.min(idx, shots.length - 1);
            const local = t - 1.3 - i * 0.95;
            const p = prog(local, 0, 0.18);
            return (
              <Panel style={{ position: "absolute", top: 440, left: 40, width: 1000, opacity: p,
                transform: `scale(${1.12 - 0.12 * p + local * 0.02})` }}>
                <Img src={staticFile(shots[i])} style={{ width: "100%", display: "block" }} />
              </Panel>
            );
          })()}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const OnePage: React.FC<{ t: number; dur: number }> = ({ t, dur }) => {
  const pan = interpolate(t, [0, dur], [0, 1], clamp);
  const live = 0.5 + 0.5 * Math.sin(t * 8);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, ...center }}><Lockup height={62} /></div>
      <Panel style={{ position: "absolute", top: 400, left: 40, right: 40, height: 780, opacity: prog(t, 0, 0.18) }}>
        <Img src={staticFile("overview.png")} style={{ height: 780, position: "absolute", top: 0,
          right: interpolate(pan, [0, 1], [0, -(780 * 2278 / 948 - 1000)]) }} />
      </Panel>
      <div style={{ position: "absolute", top: 420, right: 70, display: "flex", alignItems: "center", gap: 12,
        padding: "10px 22px", borderRadius: 30, background: "rgba(11,13,16,.85)", border: `1px solid ${C.lineStrong}` }}>
        <div style={{ width: 16, height: 16, borderRadius: 8, background: "#34c759", opacity: 0.4 + 0.6 * live }} />
        <Label color={C.offwhite} size={30}>زنده</Label>
      </div>
    </AbsoluteFill>
  );
};

const CommentCTA: React.FC<{ t: number; dur: number }> = ({ t }) => {
  const typed = "دمو".slice(0, Math.max(0, Math.min(3, Math.floor((t - 0.9) / 0.12) + 1)));
  const dm = prog(t, 1.55, 0.25);
  const bounce = Math.abs(Math.sin(t * 5)) * 16;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 230, left: 0, right: 0, ...center, opacity: prog(t, 0, 0.2) }}><Lockup height={70} /></div>
      <div style={{ position: "absolute", top: 440, left: 0, right: 0, ...center }}>
        <Label color={C.silver} size={44}>دسترسی رایگان ۱۴ روزه به محیط دمو</Label>
      </div>
      {/* Instagram-style comment field */}
      <div style={{ position: "absolute", top: 560, left: 110, right: 110, display: "flex", alignItems: "center", gap: 22,
        padding: "22px 30px", borderRadius: 50, background: C.graphite, border: `2px solid ${C.lineStrong}`, direction: "rtl",
        opacity: prog(t, 0.3, 0.2), transform: `translateY(${(1 - prog(t, 0.3, 0.22)) * 40}px)` }}>
        <div style={{ width: 76, height: 76, borderRadius: 38, background: C.carbon, flexShrink: 0 }} />
        <div style={{ flex: 1, fontFamily: fa, fontSize: 48, fontWeight: 700, color: typed ? C.offwhite : C.steel }}>
          {typed || "افزودن کامنت…"}<span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0, color: C.info }}>|</span>
        </div>
        <div style={{ fontFamily: fa, fontSize: 38, fontWeight: 700, color: C.info, opacity: typed.length === 3 ? 1 : 0.4 }}>ارسال</div>
      </div>
      {/* the reward: DM arrives */}
      <Panel style={{ position: "absolute", top: 760, left: 110, right: 110, padding: "28px 34px", direction: "rtl",
        display: "flex", gap: 24, alignItems: "center", opacity: dm, transform: `translateY(${(1 - dm) * -40}px)` }}>
        <div style={{ width: 90, height: 90, borderRadius: 45, background: C.black, ...center, border: `1px solid ${C.lineStrong}`, flexShrink: 0 }}>
          <Symbol size={52} />
        </div>
        <div>
          <div style={{ fontFamily: fa, fontWeight: 700, fontSize: 38, color: C.offwhite }}>روند</div>
          <Label size={34} color={C.silver}>لینک دموی رایگانت آماده‌ست ✓</Label>
        </div>
      </Panel>
      <div style={{ position: "absolute", top: 1010, left: 0, right: 0, ...center, transform: `translateY(${bounce}px)`, opacity: prog(t, 2.2, 0.2) }}>
        <div style={{ fontFamily: en, fontSize: 90, color: C.offwhite, lineHeight: 1 }}>↓</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- composition
const SceneSeq: React.FC<{ from: number; to: number; render: (t: number, dur: number) => React.ReactNode }> = ({ from, to, render }) => {
  const { fps } = useVideoConfig();
  const f0 = Math.round(from * fps);
  return (
    <Sequence from={f0} durationInFrames={Math.max(1, Math.round(to * fps) - f0)}>
      <Local render={render} dur={to - from} />
    </Sequence>
  );
};
const Local: React.FC<{ render: (t: number, dur: number) => React.ReactNode; dur: number }> = ({ render, dur }) => <>{render(useSec(), dur)}</>;

export const Reel: React.FC<{ variant: Variant }> = ({ variant }) => {
  const tl = TIMELINES[variant];
  const S = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
  const at = (id: string) => S[id].start;
  const end = tl.duration;
  const hooks = { A: MoneyLeak, B: SpreadsheetChaos, C: ProfitQuestion };
  const Hook = hooks[variant];

  return (
    <AbsoluteFill style={{ fontFamily: fa, direction: "rtl" }}>
      <Backdrop />
      <SceneSeq from={0} to={at("bridge")} render={(t) => <AbsoluteFill style={{ transform: shake(t, 0, 18) }}><Hook t={t} /></AbsoluteFill>} />
      <SceneSeq from={at("bridge")} to={at("s1")} render={(t) => <Bridge t={t} />} />
      <SceneSeq from={at("s1")} to={at("s2")} render={(t) => <PhoneCall t={t} />} />
      <SceneSeq from={at("s2")} to={at("s3")} render={(t) => <CalendarFlip t={t} />} />
      <SceneSeq from={at("s3")} to={at("turn")} render={(t) => <Mismatch t={t} />} />
      <SceneSeq from={at("turn")} to={at("sol")} render={(t) => <Fragments t={t} />} />
      <SceneSeq from={at("sol")} to={at("sol2")} render={(t, d) => <Solution t={t} dur={d} />} />
      <SceneSeq from={at("sol2")} to={at("cta")} render={(t, d) => <OnePage t={t} dur={d} />} />
      <SceneSeq from={at("cta")} to={S.loop ? at("loop") : end} render={(t, d) => <CommentCTA t={t} dur={d} />} />
      {S.loop && (
        // the last beat rebuilds the opening frame, so the reel loops seamlessly
        <SceneSeq from={at("loop")} to={end} render={(t, d) => <MoneyLeak t={0} appear={prog(t, 0, d * 0.8)} />} />
      )}
      <Captions segs={tl.segments as any}
        top={(id) => (id === "hook" ? (variant === "B" ? 1270 : 1150) : id === "cta" || id === "sol" || id === "sol2" ? 1290 : 1250)}
        size={(id) => (id === "hook" ? 84 : 72)} />
      <Audio src={staticFile(`mix-${variant}.wav`)} />
    </AbsoluteFill>
  );
};
