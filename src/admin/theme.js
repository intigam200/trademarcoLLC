import { COLORS } from "../theme/colors";

// Admin panel palette: reuses the public site's design tokens (navy, blue
// accent, grays) and adds the enterprise-dashboard-specific ones (dark
// sidebar, status colors) on top, so the two surfaces read as one brand.
export const ADMIN_COLORS = {
  ...COLORS,
  sidebarBg: "#101B33",
  sidebarBorder: "rgba(255,255,255,0.08)",
  sidebarText: "rgba(255,255,255,0.62)",
  sidebarTextActive: "#FFFFFF",
  contentBg: COLORS.offWhite,
  cardBg: COLORS.white,
  accent: COLORS.orange,
  accentHover: COLORS.orangeHover,
  success: "#1E8E5A",
  successBg: "#E7F6EF",
  warning: "#B7791F",
  warningBg: "#FEF3E2",
  danger: "#C0392B",
  dangerBg: "#FDECEA",
  neutral: COLORS.medGray,
  neutralBg: COLORS.lightGray,
};

export const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", to: "/admin", icon: "bar-chart", end: true },
  { label: "Products", to: "/admin/products", icon: "box" },
  { label: "Manufacturers", to: "/admin/manufacturers", icon: "factory" },
  { label: "Categories", to: "/admin/categories", icon: "clipboard" },
  { label: "Import Center", to: "/admin/import", icon: "upload" },
  { label: "RFQs", to: "/admin/rfqs", icon: "mail" },
  { label: "Settings", to: "/admin/settings", icon: "gear" },
];
