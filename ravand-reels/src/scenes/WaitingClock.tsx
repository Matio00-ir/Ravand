import { AbsoluteFill, interpolate } from "remotion";
import { fa } from "../brand/fonts";
import { Sfx } from "../components/AudioMix";
import { Icon } from "../components/Icon";
import { prog, useSceneTime } from "../lib/anim";
import { faDigits } from "../lib/persian";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = {
  days: number;
  dayLabel: string;
  customerLabel: string;
  statusWaiting: string;
  statusMissing: string;
  beats: { call: string; reveal: string };
};

const CX = safeBox.left + safeBox.width / 2;
export const CUSTOMER_CARD = { top: 880, h: 260, w: 640 };

/**
 * Scene 4 — waiting. A clock runs through two days while the customer card
 * sits on "waiting"; the call comes in on «زنگ»; on «معلوم» the status flips
 * to "no order registered" (semantic red, status dot only).
 * `freezeAt` lets FreezeZoom hold this scene's last frame.
 */
export const WaitingClock: React.FC<SceneProps & { freezeAt?: number }> = ({ scene, cover, freezeAt }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const S = scene.segmentTiming.start;
  const t = freezeAt ?? (cover ? scene.beatAt.reveal + 0.6 : now);
  const live = freezeAt === undefined && !cover;

  const runEnd = scene.beatAt.call;
  const spin = interpolate(t, [scene.from, runEnd], [0, p.days * 2], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const hourDeg = spin * 360; // two turns per day
  const minDeg = spin * 360 * 12;
  const day = Math.min(p.days, 1 + Math.floor(spin / 2 + 0.0001));

  const enter = prog(t, scene.from, 0.45);
  const ringing = t >= scene.beatAt.call && t < scene.beatAt.reveal + 0.2;
  const revealed = prog(t, scene.beatAt.reveal, 0.35);
  const ticks = Array.from({ length: 8 }, (_, i) => scene.from + 0.3 + i * ((runEnd - scene.from - 0.4) / 8));

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      {/* clock */}
      <div style={{ position: "absolute", left: CX - 150, top: 330, width: 300, height: 300 }}>
        <svg width={300} height={300} viewBox="0 0 300 300">
          <circle cx={150} cy={150} r={140} fill={color.deepRaised} stroke={color.lineDarkStrong} strokeWidth={3} />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={150 + Math.sin(a) * 118}
                y1={150 - Math.cos(a) * 118}
                x2={150 + Math.sin(a) * 128}
                y2={150 - Math.cos(a) * 128}
                stroke={color.steel}
                strokeWidth={i % 3 === 0 ? 4 : 2}
              />
            );
          })}
          <line x1={150} y1={150} x2={150} y2={72} stroke={color.offwhite} strokeWidth={7} strokeLinecap="square" transform={`rotate(${hourDeg} 150 150)`} />
          <line x1={150} y1={150} x2={150} y2={44} stroke={color.silver} strokeWidth={4} strokeLinecap="square" transform={`rotate(${minDeg} 150 150)`} />
          <rect x={143} y={143} width={14} height={14} fill={color.accent} />
        </svg>
      </div>
      {/* day counter */}
      <div
        style={{
          position: "absolute",
          top: 660,
          left: safeBox.left,
          width: safeBox.width,
          textAlign: "center",
          direction: "rtl",
          fontFamily: fa,
          fontSize: 64,
          fontWeight: 700,
          color: color.offwhite,
        }}
      >
        {faDigits(`${p.dayLabel} ${day}`)}
      </div>

      {/* customer card */}
      <div
        style={{
          position: "absolute",
          left: CX - CUSTOMER_CARD.w / 2,
          top: CUSTOMER_CARD.top,
          width: CUSTOMER_CARD.w,
          height: CUSTOMER_CARD.h,
          boxSizing: "border-box",
          borderRadius: radius.lg + 2,
          border: `1px solid ${color.lineDarkStrong}`,
          background: color.deepRaised,
          direction: "rtl",
          fontFamily: fa,
          display: "flex",
          alignItems: "center",
          gap: 36,
          padding: "0 44px",
        }}
      >
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: radius.md,
              border: `1px solid ${color.lineDarkStrong}`,
              display: "grid",
              placeItems: "center",
              background: color.deepPanel,
            }}
          >
            <Icon name="person" size={84} color={color.silver} />
          </div>
          {ringing
            ? [0, 1].map((k) => {
                const r = ((t - scene.beatAt.call) * 1.4 + k * 0.5) % 1;
                return (
                  <div
                    key={k}
                    style={{
                      position: "absolute",
                      inset: -10 - 40 * r,
                      borderRadius: radius.lg + 40 * r,
                      border: `2px solid ${color.silver}`,
                      opacity: 0.5 * (1 - r),
                    }}
                  />
                );
              })
            : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 50, fontWeight: 700, color: color.offwhite, lineHeight: 1.3 }}>{p.customerLabel}</span>
          <div style={{ position: "relative", height: 50 }}>
            <Status text={p.statusWaiting} dot={color.warning} style={{ opacity: 1 - revealed }} />
            <Status text={p.statusMissing} dot={color.error} style={{ opacity: revealed, translate: `0 ${(1 - revealed) * 10}px` }} strong />
          </div>
        </div>
        {ringing ? (
          <div style={{ marginInlineStart: "auto" }}>
            <Icon name="phone" size={56} color={color.silver} />
          </div>
        ) : null}
      </div>

      {live ? ticks.map((at, i) => <Sfx key={i} src="sfx/tick.wav" at={at} volume={0.35} sceneFrom={scene.from} />) : null}
      {live ? <Sfx src="sfx/ring.wav" at={scene.beatAt.call} volume={0.4} sceneFrom={scene.from} /> : null}
    </AbsoluteFill>
  );
};

const Status: React.FC<{ text: string; dot: string; strong?: boolean; style?: React.CSSProperties }> = ({ text, dot, strong, style }) => (
  <span
    style={{
      position: "absolute",
      insetInlineStart: 0,
      top: 0,
      display: "flex",
      alignItems: "center",
      gap: 14,
      whiteSpace: "nowrap",
      fontSize: 36,
      fontWeight: strong ? 700 : 500,
      color: strong ? color.offwhite : color.silver,
      ...style,
    }}
  >
    <span style={{ width: 14, height: 14, borderRadius: 7, background: dot }} />
    {text}
  </span>
);
