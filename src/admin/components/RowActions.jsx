import { ADMIN_COLORS } from "../theme";
import Icon from "../../components/Icon";

const btnStyle = {
  width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center",
  border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, background: ADMIN_COLORS.white,
  cursor: "pointer", marginLeft: 6,
};

export default function RowActions({ onView, onEdit, onDelete }) {
  return (
    <span style={{ display: "inline-flex" }}>
      {onView && (
        <button style={btnStyle} onClick={onView} title="View">
          <Icon type="eye" size={14} color={ADMIN_COLORS.medGray} />
        </button>
      )}
      {onEdit && (
        <button style={btnStyle} onClick={onEdit} title="Edit">
          <Icon type="edit" size={14} color={ADMIN_COLORS.medGray} />
        </button>
      )}
      {onDelete && (
        <button style={btnStyle} onClick={onDelete} title="Delete">
          <Icon type="trash" size={14} color={ADMIN_COLORS.danger} />
        </button>
      )}
    </span>
  );
}
