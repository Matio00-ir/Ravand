import { AbsoluteFill, Easing } from "remotion";
import { Headline } from "../components/Headline";
import { prog, useSceneTime } from "../lib/anim";
import { display } from "../lib/persian";
import { color, safeBox } from "../theme";
import { CUSTOMER_CARD, WaitingClock } from "./WaitingClock";
import type { SceneProps } from "./types";

type Props = { of: "WaitingClock"; headlineFromVoice?: boolean; headline?: string };

/**
 * Scene 5 — mid re-hook. Hold the previous scene's last frame, push in slowly
 * on the customer, darken everything else, and set the voice line as the
 * headline word by word, in sync with the voice (captions are off here).
 */
export const FreezeZoom: React.FC<SceneProps> = ({ scene, resolved, cover }) => {
  const p = scene.props as unknown as Props;
  const now = useSceneTime(scene);
  const t = cover ? scene.to - 0.1 : now;
  const prev = resolved.scenes.find((s) => s.component === p.of);
  if (!prev) throw new Error(`FreezeZoom: no scene with component ${p.of}`);

  const z = prog(t, scene.from, scene.to - scene.from, Easing.bezier(0.33, 0, 0.2, 1));
  const originY = CUSTOMER_CARD.top + CUSTOMER_CARD.h / 2;
  const seg = scene.segmentTiming;
  const text = p.headlineFromVoice ? seg.words.map((w) => w.w).join(" ") : p.headline ?? "";

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ scale: String(1 + 0.32 * z), transformOrigin: `${safeBox.left + safeBox.width / 2}px ${originY}px` }}>
        <WaitingClock scene={prev} resolved={resolved} freezeAt={prev.to - 1 / 30} />
      </AbsoluteFill>
      {/* darken around the customer */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 22% at 50% ${originY / 19.2}%, transparent 40%, rgba(11,13,16,${0.86 * z}) 100%)`,
        }}
      />
      {/* clear the frozen clock + day counter out of the headline band; the push-in keeps the customer card below 43% */}
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(11,13,16,${Math.min(1, z * 5)}) 0%, rgba(11,13,16,${Math.min(1, z * 5)}) 37%, rgba(11,13,16,0) 43%)` }} />
      <Headline
        t={t}
        top={330}
        size={76}
        lines={[
          {
            text: display(text),
            at: seg.start,
            wordAt: cover ? undefined : seg.words.map((w) => w.s),
          },
        ]}
        tone={() => color.offwhite}
      />
    </AbsoluteFill>
  );
};
