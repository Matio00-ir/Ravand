/**
 * RAVAND production-ERP promo — 1920×1080, silent cut (voice is added later).
 * Structure: hook → 7 pains → turn + logo → 7 real-panel solutions → close.
 * All panel footage is real UI recorded from the local DEMO database
 * (fictional factory) by scripts/record-goonagoon.mjs.
 */
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from "remotion";
import { fa } from "../brand/fonts";
import { LogoMark, Lockup } from "../brand/Logo";
import { display, faDigits } from "../lib/persian";
import { color } from "../theme";
import { DrawIcon, FPS, Kicker, Stage, Words, p, useT, type IconName } from "./kit";
import { FEATURES, PAINS, TIMELINE, type Feature } from "./script";

const s2f = (s: number) => Math.round(s * FPS);

/* ---------------------------------------------------------------- hook */
const Hook: React.FC = () => {
  const t = useT();
  const out = p(t, TIMELINE.hook.dur - 0.35, 0.35);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - out }}>
      <div style={{ width: 1500, display: "flex", flexDirection: "column", gap: 18 }}>
        <Words text="کارخانه یا تولیدی داری؟" t={t} at={0.3} size={104} stagger={0.12} />
        <Words text="چند سؤال کوتاه…" t={t} at={3.7} size={52} weight={500} color={color.silver} />
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- pains */
const Pain: React.FC<{ i: number; text: string; icon: IconName; dur: number }> = ({ i, text, icon, dur }) => {
  const t = useT();
  const out = p(t, dur - 0.3, 0.3);
  const n = faDigits(String(i + 1).padStart(2, "0"));
  return (
    <AbsoluteFill style={{ opacity: 1 - out, translate: `0 ${-30 * out}px` }}>
      {/* icon field */}
      <div
        style={{
          position: "absolute",
          left: 190,
          top: 290,
          width: 500,
          height: 500,
          borderRadius: 24,
          border: `1px solid ${color.lineDark}`,
          background: color.deepRaised,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: p(t, 0, 0.35),
          scale: String(0.94 + 0.06 * p(t, 0, 0.6) + 0.02 * (t / dur)),
        }}
      >
        <DrawIcon name={icon} size={260} t={t} at={0.15} />
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 30,
            width: 14,
            height: 14,
            borderRadius: 7,
            background: color.warning,
            opacity: p(t, 0.7, 0.3) * (0.6 + 0.4 * Math.abs(Math.sin(t * 3))),
          }}
        />
      </div>
      {/* copy */}
      <div style={{ position: "absolute", right: 190, top: 0, bottom: 0, width: 920, display: "flex", flexDirection: "column", justifyContent: "center", gap: 26 }}>
        <div style={{ direction: "rtl", fontFamily: fa, fontSize: 34, fontWeight: 600, color: color.accent, opacity: p(t, 0, 0.3) }}>
          {display(`مشکل ${n}`)}
        </div>
        <Words text={text} t={t} at={0.12} size={70} align="flex-start" stagger={0.05} lineHeight={1.5} />
      </div>
      {/* progress */}
      <div style={{ position: "absolute", bottom: 110, right: 190, display: "flex", gap: 10, direction: "rtl" }}>
        {PAINS.map((_, k) => (
          <div key={k} style={{ width: 56, height: 4, borderRadius: 2, background: k <= i ? color.offwhite : color.carbon, opacity: k === i ? 1 : 0.7 }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- turn */
const Turn: React.FC = () => {
  const t = useT();
  const d = TIMELINE.turn.dur;
  const textOut = p(t, 1.9, 0.4);
  const logo = p(t, 2.2, 0.8);
  const out = p(t, d - 0.35, 0.35);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", opacity: 1 - out }}>
      <div style={{ position: "absolute", width: 1500, opacity: 1 - textOut, translate: `0 ${-40 * textOut}px` }}>
        <Words text="همه‌ی این‌ها یک جواب دارد." t={t} at={0.15} size={96} stagger={0.1} highlight={["یک"]} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 46, opacity: logo, scale: String(0.92 + 0.08 * logo) }}>
        <Lockup scale={2.2} />
        <Words text="پنل مدیریت تولید، انبار و فروش" t={t} at={2.8} size={46} weight={500} color={color.silver} />
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------ features */
const FRAME = { left: 96, top: 170, w: 1216, h: 684 + 52 };

const FeatureScene: React.FC<{ f: Feature; index: number; dur: number }> = ({ f, index, dur }) => {
  const t = useT();
  const enter = p(t, 0, 0.7);
  // the recorded clip is slowed to fill the voice-timed scene; zoom times are in clip seconds
  const rate = Math.min(1, f.clipDur / dur);
  const out = p(t, dur - 0.35, 0.35);
  // camera: slow push-in + optional focus zooms
  // base framing: 12% in, biased away from the sidebar so panel text reads on a phone
  let scale = 1.12 + 0.04 * (t / dur);
  let ox = 40;
  let oy = 42;
  for (const z of f.zoom ?? []) {
    const k = p(t, z.at / rate, 0.9) * (1 - p(t, (z.until ?? 99) / rate, 0.7));
    scale += (z.scale - 1) * k;
    if (k > 0) {
      ox = 40 + (z.x - 40) * Math.min(1, k * 1.5);
      oy = 42 + (z.y - 42) * Math.min(1, k * 1.5);
    }
  }
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      {/* window */}
      <div
        style={{
          position: "absolute",
          left: FRAME.left,
          top: FRAME.top,
          width: FRAME.w,
          height: FRAME.h,
          borderRadius: 16,
          border: `1px solid ${color.lineDarkStrong}`,
          background: color.deepRaised,
          overflow: "hidden",
          boxShadow: "0 50px 100px rgba(0,0,0,0.55)",
          opacity: enter,
          translate: `${-60 * (1 - enter)}px ${30 * (1 - enter)}px`,
          transform: `perspective(2400px) rotateY(${4 * (1 - enter)}deg)`,
        }}
      >
        <div style={{ height: 52, display: "flex", alignItems: "center", gap: 14, padding: "0 22px", direction: "rtl", borderBottom: `1px solid ${color.lineDark}`, fontFamily: fa, fontSize: 20, fontWeight: 600, color: color.silver }}>
          <LogoMark height={20} />
          <span>{display(`روند · ${f.window}`)}</span>
        </div>
        <div style={{ position: "relative", width: FRAME.w, height: FRAME.h - 52, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, scale: String(scale), transformOrigin: `${ox}% ${oy}%` }}>
            <OffthreadVideo src={staticFile(`footage/erp/${f.clip}.mp4`)} playbackRate={rate} muted style={{ width: "100%", height: "100%" }} />
          </div>
        </div>
      </div>
      {/* copy column (RTL, right side) */}
      <div style={{ position: "absolute", right: 96, top: FRAME.top, width: 470, height: FRAME.h, display: "flex", flexDirection: "column", justifyContent: "center", gap: 30 }}>
        <div style={{ direction: "rtl" }}>
          <Kicker text={`راه‌حل ${faDigits(String(index + 1).padStart(2, "0"))} · ${f.kicker}`} t={t} at={0.25} />
        </div>
        <Words text={f.title} t={t} at={0.4} size={54} align="flex-start" stagger={0.05} lineHeight={1.45} highlight={f.hot} />
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 6 }}>
          {f.bullets.map((b, i) => {
            const k = p(t, 1.2 + i * 0.55, 0.45);
            return (
              <div key={i} style={{ direction: "rtl", display: "flex", alignItems: "flex-start", gap: 14, opacity: k, translate: `0 ${(1 - k) * 14}px` }}>
                <span style={{ marginTop: 16, width: 8, height: 8, flexShrink: 0, borderRadius: 2, background: color.accent }} />
                <span style={{ fontFamily: fa, fontSize: 29, fontWeight: 500, lineHeight: 1.6, color: color.silver }}>{display(b)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* --------------------------------------------------------------- close */
const Close: React.FC = () => {
  const t = useT();
  const chipsOut = p(t, 1.9, 0.45);
  const logo = p(t, 2.3, 0.8);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ position: "absolute", width: 1400, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22, direction: "rtl", opacity: 1 - chipsOut, scale: String(1 - 0.06 * chipsOut) }}>
        {FEATURES.map((f, i) => {
          const k = p(t, 0.1 + i * 0.12, 0.4);
          return (
            <div key={i} style={{ padding: "20px 34px", borderRadius: 12, border: `1px solid ${color.lineDarkStrong}`, background: color.deepRaised, fontFamily: fa, fontSize: 36, fontWeight: 600, color: color.offwhite, opacity: k, translate: `0 ${(1 - k) * 24}px` }}>
              {display(f.kicker)}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 54, opacity: logo, scale: String(0.94 + 0.06 * logo) }}>
        <Lockup scale={2.6} />
        <Words text="کسب‌وکار، در جریان." t={t} at={3.85} size={50} weight={600} color={color.silver} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------- composition */
export const PROMO_DURATION = s2f(TIMELINE.close.from + TIMELINE.close.dur);

export const Promo: React.FC = () => {
  let at = TIMELINE.pains.from;
  let fat = TIMELINE.features.from;
  return (
    <AbsoluteFill style={{ background: color.deep }}>
      <Stage />
      <Audio src={staticFile("audio/promo-voice.mp3")} />
      <Sequence from={0} durationInFrames={s2f(TIMELINE.hook.dur)}>
        <Hook />
      </Sequence>
      {PAINS.map((pain, i) => {
        const from = at;
        at += pain.dur;
        return (
          <Sequence key={`p${i}`} from={s2f(from)} durationInFrames={s2f(pain.dur)}>
            <Pain i={i} text={pain.text} icon={pain.icon} dur={pain.dur} />
          </Sequence>
        );
      })}
      <Sequence from={s2f(TIMELINE.turn.from)} durationInFrames={s2f(TIMELINE.turn.dur)}>
        <Turn />
      </Sequence>
      {FEATURES.map((f, i) => {
        const from = fat;
        fat += f.dur;
        return (
          <Sequence key={`f${i}`} from={s2f(from)} durationInFrames={s2f(f.dur)}>
            <FeatureScene f={f} index={i} dur={f.dur} />
          </Sequence>
        );
      })}
      <Sequence from={s2f(TIMELINE.close.from)} durationInFrames={s2f(TIMELINE.close.dur)}>
        <Close />
      </Sequence>
    </AbsoluteFill>
  );
};
