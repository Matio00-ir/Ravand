import { AbsoluteFill } from "remotion";
import { Backdrop, C, Lockup, fa } from "./brand";

// Reel cover. Everything important sits inside the centre 1080×1350 (4:5)
// crop the profile grid shows, so it reads from the grid as well as full-screen.
export const Cover: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: fa, direction: "rtl" }}>
    <Backdrop />
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(239,68,68,.16) 0, transparent 55%)" }} />
    <div style={{ position: "absolute", top: 380, left: 80, right: 80, textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 104, lineHeight: 1.3, color: C.offwhite }}>
        کسب‌وکارت داره
        <br />
        <span style={{ background: C.error, borderRadius: 16, padding: "0 22px" }}>بی‌صدا</span> پول
        <br />
        از دست می‌ده
      </div>
      <div style={{ fontWeight: 700, fontSize: 118, color: C.error, marginTop: 50, direction: "ltr", fontVariantNumeric: "tabular-nums" }}>
        −{(48_200_000).toLocaleString("fa-IR")}
      </div>
      <div style={{ fontWeight: 500, fontSize: 48, color: C.silver, marginTop: 40 }}>۳ نشانه‌ای که باید بدانی</div>
    </div>
    <div style={{ position: "absolute", top: 1440, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Lockup height={56} />
    </div>
  </AbsoluteFill>
);
