import { AbsoluteFill } from "remotion";
import { fa } from "../brand/fonts";
import { Sfx } from "../components/AudioMix";
import { Icon } from "../components/Icon";
import { mix, prog, useSceneTime } from "../lib/anim";
import { faDigits } from "../lib/persian";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = {
  customerLabel: string;
  storeA: string;
  storeB: string;
  counterLabel: string;
  counterMax: number;
  beats: { turn: string; counter: string };
};

const STORE = { w: 330, h: 300, top: 700 };
const A_X = safeBox.left + safeBox.width - STORE.w; // your store: the RTL start side
const B_X = safeBox.left; // the other store
const CUST = { w: 150, top: 1060 };

/**
 * Scene 6 — the silent loss. The customer says nothing, turns, walks to the
 * other store. Then a counter of customers who left the same way ticks up
 * and resolves to «؟» — we don't invent a number; the point is you can't know.
 */
export const LostCustomer: React.FC<SceneProps> = ({ scene, cover }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const t = cover ? scene.beatAt.counter + 3 : now;
  const live = !cover;

  const enter = prog(t, scene.from, 0.45);
  const turn = prog(t, scene.beatAt.turn - 0.1, 0.25);
  const walk = prog(t, scene.beatAt.turn + 0.15, 1.1);
  const counterIn = prog(t, scene.beatAt.counter - 0.2, 0.4);

  const tickTimes = Array.from({ length: p.counterMax }, (_, i) => scene.beatAt.counter + 0.1 + 1.25 * Math.pow(i / p.counterMax, 1.2));
  const count = tickTimes.filter((x) => t >= x).length;
  const question = prog(t, tickTimes[tickTimes.length - 1] + 0.3, 0.35);

  const custX = mix(A_X + STORE.w / 2, B_X + STORE.w / 2, walk) - CUST.w / 2;

  return (
    <AbsoluteFill style={{ opacity: enter }}>
      {/* counter (headline band) */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: safeBox.left,
          width: safeBox.width,
          direction: "rtl",
          fontFamily: fa,
          textAlign: "center",
          opacity: counterIn,
          translate: `0 ${(1 - counterIn) * 16}px`,
        }}
      >
        <div style={{ fontSize: 38, fontWeight: 600, color: color.silver }}>{p.counterLabel}</div>
        <div style={{ position: "relative", height: 250, fontSize: 210, fontWeight: 800, lineHeight: 1.2, color: color.offwhite }}>
          <span style={{ position: "absolute", inset: 0, opacity: 1 - question }}>{faDigits(String(Math.max(1, count)))}</span>
          <span style={{ position: "absolute", inset: 0, opacity: question, translate: `0 ${(1 - question) * 14}px` }}>؟</span>
        </div>
      </div>

      <Store x={A_X} label={p.storeA} dim={walk} />
      <Store x={B_X} label={p.storeB} dim={0} />

      {/* earlier customers who left the same way */}
      {tickTimes.map((at, i) => {
        const g = prog(t, at, 0.7);
        if (g <= 0 || g >= 1) return null;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: STORE.top + STORE.h / 2 - 14,
              left: mix(A_X + STORE.w / 2, B_X + STORE.w / 2, g) - 14,
              width: 28,
              height: 28,
              borderRadius: radius.xs,
              border: `2px solid ${color.silver}`,
              opacity: Math.sin(Math.PI * g) * 0.8,
            }}
          />
        );
      })}

      {/* the customer */}
      <div
        style={{
          position: "absolute",
          left: custX,
          top: CUST.top,
          width: CUST.w,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          fontFamily: fa,
        }}
      >
        <div
          style={{
            width: CUST.w,
            height: CUST.w,
            borderRadius: radius.md,
            border: `1px solid ${color.lineDarkStrong}`,
            background: color.deepRaised,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div style={{ scale: `${1 - 2 * turn} 1` }}>
            <Icon name="person" size={82} color={color.offwhite} />
          </div>
        </div>
        <span style={{ fontSize: 30, fontWeight: 600, color: color.silver }}>{p.customerLabel}</span>
      </div>

      {live ? tickTimes.map((at, i) => <Sfx key={i} src="sfx/lost.wav" at={at} volume={0.28} sceneFrom={scene.from} />) : null}
    </AbsoluteFill>
  );
};

const Store: React.FC<{ x: number; label: string; dim: number }> = ({ x, label, dim }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: STORE.top,
      width: STORE.w,
      height: STORE.h,
      boxSizing: "border-box",
      borderRadius: radius.lg + 2,
      border: `1px solid ${color.lineDarkStrong}`,
      background: color.deepRaised,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 22,
      direction: "rtl",
      fontFamily: fa,
      opacity: 1 - 0.55 * dim,
    }}
  >
    <Icon name="store" size={110} color={color.silver} />
    <span style={{ fontSize: 36, fontWeight: 700, color: color.offwhite }}>{label}</span>
  </div>
);
