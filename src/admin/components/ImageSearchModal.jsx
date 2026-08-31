import { useState } from "react";
import { ADMIN_COLORS } from "../theme";
import { inputStyle } from "./FormField";
import { searchProductImages, fetchAndStoreImage } from "../lib/adminApi";
import Icon from "../../components/Icon";
import Button from "../../components/Button";
import Modal from "./Modal";

// Search Google Images for a product photo instead of tab-switching to
// google.com — pick a result and it's downloaded, resized and re-encoded to
// WebP server-side (api/admin/image-fetch.js), then stored the same way a
// manual upload would be.
export default function ImageSearchModal({ initialQuery, onSelect, onClose }) {
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectingUrl, setSelectingUrl] = useState(null);

  const runSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setSearchError("");
    try {
      const items = await searchProductImages(query.trim());
      setResults(items);
    } catch (err) {
      setSearchError(err.message);
      setResults(null);
    } finally {
      setSearching(false);
    }
  };

  const pick = async (item) => {
    if (selectingUrl) return;
    setSelectingUrl(item.imageUrl);
    try {
      const storedUrl = await fetchAndStoreImage(item.imageUrl);
      onSelect(storedUrl);
    } catch (err) {
      window.alert(`Couldn't use that image: ${err.message}`);
      setSelectingUrl(null);
    }
  };

  return (
    <Modal title="Search Google Images" onClose={onClose}>
      <form onSubmit={runSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          autoFocus
          style={{ ...inputStyle, flex: 1 }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Emerson DVC6200-D1"
        />
        <Button type="submit" variant="primary" disabled={searching || !query.trim()} style={{ padding: "10px 18px", fontSize: 13, whiteSpace: "nowrap" }}>
          {searching ? "Searching…" : "Search"}
        </Button>
      </form>

      {searchError && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>
          {searchError}
        </div>
      )}

      {results && results.length === 0 && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.medGray, textAlign: "center", padding: "24px 0" }}>
          No results. Try a different search.
        </div>
      )}

      {results && results.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, maxHeight: 420, overflowY: "auto" }}>
          {results.map((item) => {
            const isSelecting = selectingUrl === item.imageUrl;
            const disabled = Boolean(selectingUrl) && !isSelecting;
            return (
              <button
                key={item.imageUrl}
                type="button"
                onClick={() => pick(item)}
                disabled={Boolean(selectingUrl)}
                title={item.title}
                style={{
                  position: "relative", padding: 0, border: `1.5px solid ${ADMIN_COLORS.border}`, borderRadius: 6,
                  overflow: "hidden", cursor: selectingUrl ? "default" : "pointer", background: ADMIN_COLORS.lightGray,
                  aspectRatio: "1 / 1", opacity: disabled ? 0.4 : 1,
                }}
              >
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                {isSelecting && (
                  <div style={{
                    position: "absolute", inset: 0, background: "rgba(255,255,255,0.85)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: ADMIN_COLORS.navy,
                  }}>
                    Saving…
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {!results && !searching && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.medGray, padding: "24px 0", justifyContent: "center" }}>
          <Icon type="search" size={16} color={ADMIN_COLORS.medGray} />
          Search for the manufacturer and part number above.
        </div>
      )}
    </Modal>
  );
}
