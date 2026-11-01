import { AbsoluteFill } from "remotion";
import { fa } from "../brand/fonts";
import { Icon, type IconName } from "../components/Icon";
import { prog, useSceneTime } from "../lib/anim";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = {
  roles: string[];
  statusLines: string[];
  breakAfterRole: number;
  beats: { seen: string; noNews: string; familiar: string };
};

const ICONS: IconName[] = ["sales", "inventory", "finance"];
const CARD = { w: 600, h: 150 };
const TOPS = [380, 720, 1060];
const CX = safeBox.left + safeBox.width / 2;

/**
 * Scene 3 — the hand-off that breaks. Three roles stacked as a chain; the
 * order leaves the first, the connector breaks halfway, the order drops out.
 * Each role's status line lands on the word that names it in the voice.
 */
export const BrokenRelay: React.FC<SceneProps> = ({ scene, cover }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const S = scene.segmentTiming.start;
  const t = cover ? S + 3 : now;

  const statusAt = [S + 0.4, scene.beatAt.seen, scene.beatAt.noNews];
  const travel = prog(t, S + 0.7, 0.8);
  const broken = prog(t, S + 1.5, 0.35);
  const drop = prog(t, S + 1.55, 0.7);
  const settle = prog(t, scene.beatAt.familiar, 0.5);

  const c0Bottom = TOPS[0] + CARD.h;
  const c0Len = TOPS[1] - c0Bottom;
  const mid = c0Bottom + c0Len / 2;

  return (
    <AbsoluteFill style={{ opacity: 1 - 0.35 * settle }}>
      {/* connector 0 — breaks in the middle */}
      <Line x={CX} y={c0Bottom} len={(c0Len / 2 - 10) * prog(t, scene.from + 0.2, 0.4)} on={travel > 0} />
      <Line
        x={CX + 18 * broken}
        y={mid + 10 + 12 * broken}
        len={(c0Len / 2 - 10) * prog(t, scene.from + 0.3, 0.4)}
        on={false}
        style={{ opacity: 1 - 0.6 * broken, rotate: `${6 * broken}deg`, transformOrigin: "top" }}
      />
      {/* connector 1 — nothing ever reaches it */}
      <Line x={CX} y={TOPS[1] + CARD.h} len={(TOPS[2] - TOPS[1] - CARD.h) * prog(t, scene.from + 0.35, 0.4)} on={false} dim />

      {/* the order packet */}
      {travel > 0 && drop < 1 ? (
        <div
          style={{
            position: "absolute",
            left: CX - 17 + 60 * drop,
            top: c0Bottom + (mid - c0Bottom - 20) * travel + 260 * drop * drop,
            width: 34,
            height: 34,
            borderRadius: radius.sm,
            background: color.accent,
            opacity: 1 - drop,
            rotate: `${40 * drop}deg`,
          }}
        />
      ) : null}

      {p.roles.map((role, i) => {
        const enter = cover ? 1 : prog(t, scene.from + i * 0.08, 0.45);
        const st = cover ? 1 : prog(t, statusAt[i] - 0.05, 0.35);
        const sent = i === 0;
        return (
          <div
            key={role}
            style={{
              position: "absolute",
              left: CX - CARD.w / 2,
              top: TOPS[i],
              width: CARD.w,
              height: CARD.h,
              boxSizing: "border-box",
              borderRadius: radius.lg + 2,
              border: `1px solid ${sent && travel > 0 ? color.lineDarkStrong : color.lineDark}`,
              background: color.deepRaised,
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "0 40px",
              direction: "rtl",
              fontFamily: fa,
              opacity: enter,
              translate: `0 ${(1 - enter) * 20}px`,
            }}
          >
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: radius.md,
                border: `1px solid ${color.lineDarkStrong}`,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Icon name={ICONS[i]} size={46} color={color.silver} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 46, fontWeight: 700, color: color.offwhite, lineHeight: 1.3 }}>{role}</span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 30,
                  fontWeight: 500,
                  color: sent ? color.silver : color.steel,
                  opacity: st,
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    background: sent ? color.accent : "transparent",
                    border: sent ? "none" : `2px solid ${color.steel}`,
                  }}
                />
                {p.statusLines[i]}
              </span>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Line: React.FC<{ x: number; y: number; len: number; on: boolean; dim?: boolean; style?: React.CSSProperties }> = ({
  x,
  y,
  len,
  on,
  dim,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 1.5,
      top: y,
      width: 3,
      height: Math.max(0, len),
      background: on ? color.accent : dim ? color.lineDarkStrong : "rgba(255,255,255,0.22)",
      ...style,
    }}
  />
);
