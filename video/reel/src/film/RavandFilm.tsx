import React from "react";
import { AbsoluteFill } from "remotion";
import { C, EN, lerp, ramp, E, useT } from "./tokens";
import { Backdrop, Finish, PlaneField } from "./Backdrop";
import { Connectors } from "./Connectors";
import { NodeField } from "./NodeField";
import { Dashboard } from "./Dashboard";
import { PageIndex } from "./primitives";
import { AppearsScene, ClarityScene, ComplexityScene, FlowScene, FragmentationScene, ProductScene } from "./Scenes";
import { BrandReveal } from "./BrandReveal";

/**
 * RAVAND — brand film. "Business, in flow."
 *
 * One persistent system (rails, planes, module nodes, bus, product surface) is driven by the global
 * clock; scenes only add type. That is what keeps the cuts continuous: the nodes that scatter in 01
 * are the same nodes that become the product's sidebar in 05, and the rails they were registered on
 * are the lines that converge into the logo in 07.
 */
export const RavandFilm: React.FC = () => {
  const t = useT();
  // A slow push during fragmentation, released as the structure registers (so nodes meet the rails exactly).
  const cam = lerp(1, 1.04, ramp(t, 0, 16, E.soft)) - 0.04 * ramp(t, 16, 20, E.inOut);
  return (
    <AbsoluteFill style={{ background: C.black, fontFamily: EN }}>
      <Backdrop />
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: "50% 50%" }}>
        <PlaneField />
        <Connectors />
        <Dashboard />
        <NodeField />
      </AbsoluteFill>
      <Finish />
      <PageIndex />
      <ComplexityScene />
      <FragmentationScene />
      <AppearsScene />
      <FlowScene />
      <ProductScene />
      <ClarityScene />
      <BrandReveal />
    </AbsoluteFill>
  );
};
