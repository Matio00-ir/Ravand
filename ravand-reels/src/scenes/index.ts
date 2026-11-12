import type React from "react";
import { BrokenRelay } from "./BrokenRelay";
import { ChatHook } from "./ChatHook";
import { CtaKeyword } from "./CtaKeyword";
import { FreezeZoom } from "./FreezeZoom";
import { LostCustomer } from "./LostCustomer";
import { ProductFootage } from "./ProductFootage";
import type { SceneProps } from "./types";
import { WaitingClock } from "./WaitingClock";

/** Scene components by the name used in content JSON ("component"). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sceneComponents: Record<string, React.FC<SceneProps & any>> = {
  ChatHook,
  BrokenRelay,
  WaitingClock,
  FreezeZoom,
  LostCustomer,
  ProductFootage,
  CtaKeyword,
};
