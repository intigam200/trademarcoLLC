import { useState } from "react";
import { ADMIN_COLORS } from "../theme";
import Icon from "../../components/Icon";

// Chip-style multi-value input for CSV multi-value fields (applications,
// industries, alternative part numbers, related products). Press Enter or
// comma to add, Backspace on an empty input to remove the last chip.
export default function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft("");
  };

  const removeTag = (tag) => onChange(value.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && !draft && value.length) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 6, padding: 8,
      border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, background: ADMIN_COLORS.white, minHeight: 44,
    }}>
      {value.map((tag) => (
        <span key={tag} style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 4,
          background: ADMIN_COLORS.iconBlueBg, color: ADMIN_COLORS.iconBlue, fontSize: 12, fontWeight: 600,
        }}>
          {tag}
          <button type="button" onClick={() => removeTag(tag)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}>
            <Icon type="close" size={11} color={ADMIN_COLORS.iconBlue} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length ? "" : placeholder}
        style={{ flex: "1 1 120px", minWidth: 120, border: "none", outline: "none", fontSize: 13, fontFamily: "inherit", background: "transparent" }}
      />
    </div>
  );
}
