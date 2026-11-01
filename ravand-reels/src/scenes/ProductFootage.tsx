import { OffthreadVideo as Video } from "remotion";
import { AbsoluteFill, staticFile } from "remotion";
import { fa } from "../brand/fonts";
import { Sfx } from "../components/AudioMix";
import { WindowFrame } from "../components/WindowFrame";
import { prog, useSceneTime } from "../lib/anim";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = {
  footage: string;
  windowTitle: string;
  railLabel: string;
  stages: string[];
  beats: Record<string, string>;
};

const WIN = { top: 560, h: 710 };

/**
 * Scene 7 — real product. Plays the recorded RAVAND UI (public/footage/…)
 * in a window frame; above it, the order path (ثبت · انبار · ارسال) lights
 * stage by stage on the words that name them. If the footage file is
 * missing, a clearly labelled placeholder is shown instead — never a mockup.
 */
export const ProductFootage: React.FC<SceneProps & { hasFootage?: boolean }> = ({ scene, cover, hasFootage }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const t = cover ? scene.to - 0.2 : now;
  const stageAt = p.stages.map((_, i) => scene.beatAt[`stage${i}`]);
  const winIn = prog(t, scene.from, 0.55);
  const railIn = prog(t, scene.from + 0.1, 0.45);

  return (
    <AbsoluteFill>
      {/* the order path */}
      <div
        style={{
          position: "absolute",
          top: 300,
          left: safeBox.left,
          width: safeBox.width,
          direction: "rtl",
          fontFamily: fa,
          opacity: railIn,
        }}
      >
        <div style={{ textAlign: "center", fontSize: 32, fontWeight: 600, color: color.steel, marginBottom: 26 }}>{p.railLabel}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {p.stages.map((stage, i) => {
            const on = prog(t, stageAt[i] - 0.05, 0.3);
            const link = i < p.stages.length - 1 ? prog(t, stageAt[i + 1] - 0.35, 0.35) : 0;
            return (
              <div key={stage} style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 30px",
                    borderRadius: radius.md,
                    border: `1px solid ${on > 0.5 ? color.accent : color.lineDarkStrong}`,
                    background: `rgba(113,133,158,${0.22 * on})`,
                    fontSize: 44,
                    fontWeight: 700,
                    color: on > 0.5 ? color.offwhite : color.steel,
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: 7, background: on > 0.5 ? color.accent : color.carbon }} />
                  {stage}
                </div>
                {i < p.stages.length - 1 ? (
                  <div style={{ position: "relative", width: 70, height: 3, background: color.lineDarkStrong }}>
                    {/* fills in reading direction (right → left) */}
                    <div style={{ position: "absolute", top: 0, right: 0, height: 3, width: `${link * 100}%`, background: color.accent }} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <WindowFrame
        title={p.windowTitle}
        width={safeBox.width}
        height={WIN.h}
        style={{ left: safeBox.left, top: WIN.top, opacity: winIn, translate: `0 ${(1 - winIn) * 30}px` }}
      >
        {hasFootage ? (
          <Video
            src={staticFile(p.footage)}
            muted
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
          />
        ) : (
          <Placeholder path={p.footage} />
        )}
      </WindowFrame>

      {cover ? null : stageAt.map((at, i) => <Sfx key={i} src="sfx/step.wav" at={at} volume={0.35} sceneFrom={scene.from} />)}
    </AbsoluteFill>
  );
};

const Placeholder: React.FC<{ path: string }> = ({ path }) => (
  <AbsoluteFill
    style={{
      margin: 24,
      border: `2px dashed ${color.steel}`,
      borderRadius: radius.md,
      display: "grid",
      placeItems: "center",
      textAlign: "center",
      fontFamily: fa,
      direction: "rtl",
      color: color.silver,
      fontSize: 34,
      lineHeight: 1.8,
    }}
  >
    <div>
      جای فوتیج واقعی محصول
      <div style={{ direction: "ltr", fontSize: 26, color: color.steel }}>public/{path}</div>
    </div>
  </AbsoluteFill>
);
