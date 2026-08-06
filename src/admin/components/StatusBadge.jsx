import { ADMIN_COLORS } from "../theme";

const STATUS_STYLES = {
  published: { bg: ADMIN_COLORS.successBg, color: ADMIN_COLORS.success, label: "Published" },
  draft: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Draft" },
  active: { bg: ADMIN_COLORS.successBg, color: ADMIN_COLORS.success, label: "Active" },
  inactive: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Inactive" },
  archived: { bg: ADMIN_COLORS.dangerBg, color: ADMIN_COLORS.danger, label: "Archived" },
  unread: { bg: ADMIN_COLORS.warningBg, color: ADMIN_COLORS.warning, label: "Unread" },
  in_progress: { bg: ADMIN_COLORS.iconBlueBg, color: ADMIN_COLORS.iconBlue, label: "In Progress" },
  quoted: { bg: ADMIN_COLORS.successBg, color: ADMIN_COLORS.success, label: "Quoted" },
  closed: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Closed" },
};

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.draft;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "4px 10px", borderRadius: 20,
      fontSize: 12, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: "nowrap",
    }}>
      {s.label}
    </span>
  );
}
