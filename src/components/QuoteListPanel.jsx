import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { useQuoteList } from "../context/QuoteListContext";
import Icon from "./Icon";
import Button from "./Button";
import ContactForm from "./ContactForm";

export default function QuoteListPanel({ open, onClose }) {
  const { items, removeItem, clear } = useQuoteList();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!open) { setShowForm(false); return; }
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Rendered into document.body via a portal — Navbar (this panel's usual
  // caller) applies backdrop-filter when scrolled, which creates a CSS
  // containing block for `position: fixed` descendants and would otherwise
  // trap this panel inside the navbar's own small box instead of the
  // viewport.
  return createPortal(
    <>
      <div className="tm-ql-backdrop" onClick={onClose} />
      <div className="tm-ql-panel" role="dialog" aria-modal="true" aria-label="Quote list">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${COLORS.borderGray}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {showForm && (
              <button type="button" onClick={() => setShowForm(false)} aria-label="Back to list" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                <Icon type="chevron-left" size={18} color={COLORS.navy} />
              </button>
            )}
            <h2 style={{ fontSize: 17, fontWeight: 800, color: COLORS.navy, margin: 0 }}>
              {showForm ? "Request a Quote" : `Quote List${items.length ? ` (${items.length})` : ""}`}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
            <Icon type="close" size={20} color={COLORS.medGray} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {showForm ? (
            <ContactForm items={items} onSubmitted={clear} />
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 12px" }}>
              <Icon type="clipboard" size={30} color={COLORS.borderGray} />
              <p style={{ fontSize: 14, color: COLORS.medGray, margin: "16px 0 0" }}>
                Your quote list is empty. Add products from any product page to request quotes for several items at once.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {items.map((item) => (
                <div key={item.productId} style={{ display: "flex", gap: 12, alignItems: "center", border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: 10 }}>
                  <div style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 6, background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    ) : (
                      <Icon type="box" size={20} color={COLORS.borderGray} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.productName}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.medGray, marginTop: 2 }}>
                      {[item.manufacturerName, item.partNumber].filter(Boolean).join(" — ")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.productName} from quote list`}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 6, flexShrink: 0, display: "flex" }}
                  >
                    <Icon type="close" size={16} color={COLORS.medGray} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!showForm && items.length > 0 && (
          <div style={{ padding: 24, borderTop: `1px solid ${COLORS.borderGray}` }}>
            <Button variant="primary" onClick={() => setShowForm(true)} style={{ width: "100%", justifyContent: "center" }}>
              Request Quote for These Items <Icon type="arrow-right" size={18} color={COLORS.white} />
            </Button>
          </div>
        )}

        {!showForm && (
          <div style={{ padding: "0 24px 24px", textAlign: "center" }}>
            <Link to="/products" onClick={onClose} style={{ fontSize: 13, fontWeight: 600, color: COLORS.orange, textDecoration: "none" }}>
              Browse products to add more
            </Link>
          </div>
        )}
      </div>

      <style>{`
        .tm-ql-backdrop {
          position: fixed; inset: 0; background: rgba(15,25,45,0.22); z-index: 200;
          animation: tm-ql-fade 0.2s ease;
        }
        .tm-ql-panel {
          position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw;
          background: ${COLORS.white}; z-index: 201; display: flex; flex-direction: column;
          box-shadow: -8px 0 30px rgba(0,0,0,0.2);
          animation: tm-ql-slide-in 0.25s ease;
        }
        @keyframes tm-ql-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tm-ql-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          .tm-ql-backdrop, .tm-ql-panel { animation: none; }
        }
      `}</style>
    </>,
    document.body
  );
}
