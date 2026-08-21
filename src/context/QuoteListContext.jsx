import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "tm-quote-list";
const QuoteListContext = createContext(null);

function readStored() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Client-only "list of products to request a quote for" — lets a buyer
// collect several products across pages before sending one combined RFQ,
// instead of submitting the RFQ form once per product. Persisted to
// localStorage only (no backend table); the list is flattened into the
// existing RFQ submission's message text when sent (see ContactForm's
// `items` prop), so it reuses the existing RFQ pipeline unchanged.
export function QuoteListProvider({ children }) {
  const [items, setItems] = useState(readStored);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable (private browsing, quota) — the list just
      // won't survive a reload; nothing else depends on this succeeding.
    }
  }, [items]);

  const addItem = useCallback((item) => {
    setItems((list) => (list.some((i) => i.productId === item.productId) ? list : [...list, item]));
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((list) => list.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((productId) => items.some((i) => i.productId === productId), [items]);

  return (
    <QuoteListContext.Provider value={{ items, addItem, removeItem, clear, has }}>
      {children}
    </QuoteListContext.Provider>
  );
}

export function useQuoteList() {
  const ctx = useContext(QuoteListContext);
  if (!ctx) throw new Error("useQuoteList must be used within a QuoteListProvider");
  return ctx;
}
