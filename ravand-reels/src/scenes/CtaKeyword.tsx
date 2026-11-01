import { AbsoluteFill } from "remotion";
import { fa, latin } from "../brand/fonts";
import { Lockup } from "../brand/Logo";
import { Sfx } from "../components/AudioMix";
import { Headline } from "../components/Headline";
import { Icon } from "../components/Icon";
import { prog, useSceneTime } from "../lib/anim";
import { display } from "../lib/persian";
import { color, radius, safeBox } from "../theme";
import type { SceneProps } from "./types";

type Props = { headline: string; note: string; beats: { keyword: string; free: string } };

/**
 * Scene 8 — CTA. Lockup + tagline, the instruction, and the keyword as a
 * prominent chip that settles on the spoken keyword.
 */
export const CtaKeyword: React.FC<SceneProps> = ({ scene, resolved, cover }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const t = cover ? scene.to : now;
  const kw = resolved.content.ctaKeyword;

  const logoIn = prog(t, scene.from, 0.6);
  const chip = prog(t, scene.beatAt.keyword - 0.1, 0.45);
  const noteIn = prog(t, scene.beatAt.free - 0.1, 0.45);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 300,
          left: safeBox.left,
          width: safeBox.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: logoIn,
          translate: `0 ${(1 - logoIn) * 14}px`,
        }}
      >
        <Lockup scale={1.5} />
        <div style={{ fontFamily: latin, fontWeight: 700, fontSize: 36, letterSpacing: "-0.02em", color: color.silver }}>
          {resolved.content.tagline}
        </div>
      </div>

      <Headline t={t} top={540} size={64} lines={[{ text: p.headline, at: cover ? 0 : scene.from + 0.35 }]} />

      <div
        style={{
          position: "absolute",
          top: 760,
          left: safeBox.left,
          width: safeBox.width,
          display: "flex",
          justifyContent: "center",
          opacity: chip,
          scale: String(0.96 + 0.04 * chip),
        }}
      >
        <div
          style={{
            direction: "rtl",
            display: "flex",
            alignItems: "center",
            gap: 30,
            padding: "18px 56px 26px",
            borderRadius: radius.lg + 6,
            background: color.offwhite,
            color: color.deep,
            fontFamily: fa,
            fontWeight: 800,
            fontSize: 150,
            lineHeight: 1.25,
            boxShadow: `0 0 0 ${10 * chip}px rgba(113,133,158,0.28)`,
          }}
        >
          <Icon name="message" size={96} color={color.deep} strokeWidth={1.8} />
          {kw}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 1110,
          left: safeBox.left,
          width: safeBox.width,
          textAlign: "center",
          direction: "rtl",
          fontFamily: fa,
          fontSize: 40,
          fontWeight: 600,
          color: color.silver,
          opacity: noteIn,
        }}
      >
        {display(p.note)}
      </div>

      {cover ? null : <Sfx src="sfx/resolve.wav" at={scene.beatAt.keyword} volume={0.4} sceneFrom={scene.from} />}
    </AbsoluteFill>
  );
};
