/**
 * Icons in the RAVAND grammar (web/components/system/ModuleIcon.tsx):
 * geometric monoline, 1.5 stroke on a 20-unit grid, square caps, mitred
 * joins. The brand bans arrows, checkmarks, gears, network nodes — so do we.
 * inventory / finance / sales paths are copied from the app; the rest are
 * drawn in the same grammar.
 */
const paths = {
  inventory: (
    <>
      <path d="M2.5 5.5h15v12h-15z" />
      <path d="M2.5 10h15" />
      <path d="M10 10v7.5" />
      <path d="M6.5 2.5h7v3h-7z" />
    </>
  ),
  finance: (
    <>
      <path d="M2.5 2.5v15h15" />
      <path d="M5.5 13.5 9 9.5l3 2.5 4.5-6.5" />
    </>
  ),
  sales: (
    <>
      <path d="M2.5 17.5h4.5V13h4.5V8.5h4.5V4" />
      <path d="M2.5 17.5h15" />
    </>
  ),
  // a person: square head, shoulders as a flat-topped block
  person: (
    <>
      <path d="M7 2.5h6v6H7z" />
      <path d="M3.5 17.5V12h13v5.5" />
    </>
  ),
  // a storefront: awning band, body, door
  store: (
    <>
      <path d="M2.5 7.5 4 2.5h12l1.5 5z" />
      <path d="M3.5 7.5v10h13v-10" />
      <path d="M8 17.5v-5h4v5" />
    </>
  ),
  // a message: a rectangle with a squared tail
  message: (
    <>
      <path d="M2.5 3.5h15v10H8l-4 3.5v-3.5H2.5z" />
    </>
  ),
  // phone handset, squared
  phone: (
    <>
      <path d="M6 2.5h8v15H6z" />
      <path d="M8.5 14.5h3" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

export const Icon: React.FC<{ name: IconName; size: number; color: string; strokeWidth?: number }> = ({
  name,
  size,
  color,
  strokeWidth = 1.5,
}) => (
  <svg
    viewBox="0 0 20 20"
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="square"
    strokeLinejoin="miter"
  >
    {paths[name]}
  </svg>
);
