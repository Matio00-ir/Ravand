import React from "react";
import { Composition } from "remotion";
import { loadFont as loadVazirmatn } from "@remotion/google-fonts/Vazirmatn";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { HeroMotion, HERO_MOTION } from "./HeroMotion";
import { PlatformMotion, PLATFORM_MOTION } from "./PlatformMotion";
import { heroMotionProps, platformMotionProps } from "./props";
import fa from "../messages/fa.json";
import en from "../messages/en.json";

// The site provides these fonts itself; Studio and renders load them here.
loadVazirmatn("normal", { weights: ["400", "700"], subsets: ["arabic", "latin"] });
loadManrope("normal", { weights: ["400", "700"], subsets: ["latin"] });

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HeroMotionFa" component={HeroMotion} {...HERO_MOTION} defaultProps={heroMotionProps("fa", fa)} />
    <Composition id="HeroMotionEn" component={HeroMotion} {...HERO_MOTION} defaultProps={heroMotionProps("en", en)} />
    {(["fa", "en"] as const).flatMap((locale) =>
      (["wide", "tall"] as const).map((layout) => (
        <Composition
          key={locale + layout}
          id={`Platform${layout === "wide" ? "Wide" : "Tall"}${locale === "fa" ? "Fa" : "En"}`}
          component={PlatformMotion}
          {...PLATFORM_MOTION[layout]}
          fps={PLATFORM_MOTION.fps}
          durationInFrames={PLATFORM_MOTION.durationInFrames}
          defaultProps={platformMotionProps(locale, layout, locale === "fa" ? fa : en)}
        />
      ))
    )}
  </>
);
