// Landscape 1920×1080 layout. Every position in the film derives from these constants, so a
// portrait variant only needs a second copy of this file (see README, "Second iteration").

/** The site's rails: hairlines at 0/25/50/75/100% of a 1600px shell. */
export const RAILS = [160, 560, 960, 1360, 1760];

/** Registered node grid: 4 columns centred between rails, 2 rows either side of the bus. */
export const COL_X = [360, 760, 1160, 1560];
export const ROW_Y = [400, 680];
export const BUS_Y = 540;
export const NODE_W = 300;
export const NODE_H = 156;

/** The product surface: right-aligned to the last rail, as in the website hero. */
export const DASH = { x: 600, y: 200, w: 1160, h: 680, sidebar: 200 };

/** Sidebar rows (module nodes land here). */
export const SIDEBAR = { x: DASH.x + 8, w: DASH.sidebar - 16, h: 30, y0: DASH.y + 44 + 46, pitch: 38 };
