import { AbsoluteFill, Easing, interpolate } from "remotion";
import { fa } from "../brand/fonts";
import { Sfx } from "../components/AudioMix";
import { Headline } from "../components/Headline";
import { Icon } from "../components/Icon";
import { prog, useSceneTime } from "../lib/anim";
import { faDigits } from "../lib/persian";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = {
  headline: string[];
  threadTitle: string;
  lostMessage: string;
  messages: string[];
  beats: { line2: string };
};

/**
 * Scenes 1+2 — visual hook + text hook.
 * A crowded group thread floods past (notification blips), stops dead; the
 * one message that was an order detaches and falls out of the list; the gap
 * closes as if nothing happened. Then silence, and the voice.
 * Generic chat UI in RAVAND's dark panel style — not any messenger's branding.
 */
const PANEL = { top: 720, height: 740 };
const HEADER = 96;
const STEP = 118; // bubble height + gap
const BUBBLE_H = 104;
const COUNT = 30;
const LOST = 22;
const STOP = 1.0; // scroll stops (seconds)
const SENDERS = ["سارا · فروش", "رضا · انبار", "مهدی · ویزیتور", "نیلوفر · حسابداری"];

export const ChatHook: React.FC<SceneProps> = ({ scene, cover }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const t = cover ? STOP - 0.02 : now;

  const listViewport = PANEL.height - HEADER;
  const finalScroll = LOST * STEP - listViewport / 2 + BUBBLE_H / 2;
  const scroll = interpolate(t, [0, STOP], [0, finalScroll], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.35, 0.35, 1),
  });

  const fall = cover ? 0 : prog(t, STOP + 0.04, 0.85, Easing.in(Easing.quad));
  const closeGap = cover ? 0 : prog(t, STOP + 0.55, 0.45);
  const dim = cover ? 0 : prog(t, 2.3, 0.6);
  const unread = Math.round(interpolate(t, [0, STOP], [184, 300], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  const line2At = scene.beatAt.line2;
  const lostY = PANEL.top + HEADER + LOST * STEP - scroll; // screen y of the order bubble

  const pings = Array.from({ length: 9 }, (_, i) => i * 0.108);

  return (
    <AbsoluteFill>
      {/* the thread */}
      <div
        style={{
          position: "absolute",
          left: safeBox.left,
          top: PANEL.top,
          width: safeBox.width,
          height: PANEL.height,
          borderRadius: radius.lg + 4,
          border: `1px solid ${color.lineDarkStrong}`,
          background: color.deepRaised,
          overflow: "hidden",
          opacity: 1 - 0.55 * dim,
        }}
      >
        <div
          style={{
            height: HEADER,
            borderBottom: `1px solid ${color.lineDark}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            direction: "rtl",
            fontFamily: fa,
            background: color.deepRaised,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Icon name="message" size={34} color={color.silver} />
            <span style={{ fontSize: 30, fontWeight: 700, color: color.offwhite }}>{p.threadTitle}</span>
          </div>
          <span
            style={{
              fontSize: 24,
              fontWeight: 600,
              color: color.offwhite,
              background: color.carbon,
              borderRadius: radius.sm,
              padding: "4px 14px",
            }}
          >
            {faDigits(`${unread} پیام جدید`)}
          </span>
        </div>
        <div style={{ position: "absolute", top: HEADER, left: 0, right: 0, translate: `0 ${-scroll}px` }}>
          {Array.from({ length: COUNT }, (_, i) => {
            const isLost = i === LOST;
            const shift = i > LOST ? -STEP * closeGap : 0;
            return (
              <Bubble
                key={i}
                y={i * STEP + shift + 14}
                text={isLost ? p.lostMessage : p.messages[i % p.messages.length]}
                sender={SENDERS[(i * 3) % SENDERS.length]}
                time={`۱۰:${faDigits(String(10 + i).padStart(2, "0"))}`}
                outgoing={i % 4 === 2}
                order={isLost}
                hidden={isLost && fall > 0}
              />
            );
          })}
        </div>
      </div>

      {/* the order bubble, falling out of the thread (drawn outside the clip) */}
      {fall > 0 ? (
        <div style={{ position: "absolute", left: safeBox.left, top: 0, width: safeBox.width, height: 1920 }}>
          <Bubble
            y={lostY + 14 + 760 * fall}
            text={p.lostMessage}
            sender={SENDERS[(LOST * 3) % SENDERS.length]}
            time={`۱۰:${faDigits(String(10 + LOST))}`}
            outgoing={false}
            order
            style={{ rotate: `${-7 * fall}deg`, opacity: 1 - prog(fall, 0.35, 0.65) }}
          />
        </div>
      ) : null}

      <Headline
        t={t}
        top={290}
        size={80}
        lines={[
          { text: p.headline[0], at: 0 },
          { text: p.headline[1], at: cover ? 0 : line2At },
        ]}
        tone={(li) => (li === 1 ? color.silver : color.offwhite)}
      />

      {cover
        ? null
        : pings.map((at, i) => (
            <Sfx key={i} src={i % 2 ? "sfx/ping2.wav" : "sfx/ping.wav"} at={at} volume={0.32 + (i % 3) * 0.05} sceneFrom={scene.from} />
          ))}
      {cover ? null : <Sfx src="sfx/drop.wav" at={STOP + 0.04} volume={0.55} sceneFrom={scene.from} />}
    </AbsoluteFill>
  );
};

const Bubble: React.FC<{
  y: number;
  text: string;
  sender: string;
  time: string;
  outgoing: boolean;
  order?: boolean;
  hidden?: boolean;
  style?: React.CSSProperties;
}> = ({ y, text, sender, time, outgoing, order, hidden, style }) => (
  <div
    style={{
      position: "absolute",
      top: y,
      left: 24,
      right: 24,
      height: 104,
      display: "flex",
      direction: "rtl",
      justifyContent: outgoing ? "flex-end" : "flex-start",
      visibility: hidden ? "hidden" : "visible",
      ...style,
    }}
  >
    <div
      style={{
        maxWidth: 640,
        height: 104,
        boxSizing: "border-box",
        padding: "12px 22px",
        borderRadius: radius.lg,
        background: outgoing ? color.carbon : color.deepPanel,
        border: `1px solid ${order ? color.accent : color.lineDark}`,
        fontFamily: fa,
        direction: "rtl",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 21, fontWeight: 600, color: color.steel }}>
        <span>{sender}</span>
        <span style={{ direction: "ltr", unicodeBidi: "isolate" }}>{time}</span>
        {order ? (
          <span
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: color.offwhite,
              background: color.accent,
              borderRadius: radius.xs,
              padding: "0 10px",
            }}
          >
            سفارش
          </span>
        ) : null}
      </div>
      <div
        style={{
          fontSize: 29,
          fontWeight: order ? 700 : 500,
          color: color.offwhite,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {faDigits(text)}
      </div>
    </div>
  </div>
);
