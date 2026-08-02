// Phase 1 has no database yet, so admin list/detail pages work against
// in-memory placeholder records. Everything here is shaped exactly like the
// real catalog schema (see src/data/catalog/schema.js) and RFQ fields the
// spec calls for, so swapping this for real API calls later is a data-layer
// change only — no page/table code should need to change.

export const MOCK_MANUFACTURERS = [
  { id: "abb", name: "ABB", description: "Global technology leader in electrification and industrial automation.", website: "https://abb.com", status: "active" },
  { id: "emerson", name: "Emerson", description: "Global provider of automation, measurement and control technologies.", website: "https://emerson.com", status: "active" },
  { id: "fisher", name: "Fisher", description: "Control valve and regulator brand used in process control applications.", website: "", status: "draft" },
  { id: "parker", name: "Parker", description: "Global manufacturer of motion and control technologies.", website: "https://parker.com", status: "active" },
  { id: "honeywell", name: "Honeywell", description: "Diversified technology manufacturer, strong in industrial automation.", website: "https://honeywell.com", status: "active" },
  { id: "siemens", name: "Siemens", description: "Global industrial manufacturer providing automation and electrification.", website: "https://siemens.com", status: "active" },
];

export const MOCK_CATEGORIES = [
  { id: "valves", name: "Valves", description: "Gate, globe, ball, check, butterfly and more.", parent: "", status: "active" },
  { id: "filters", name: "Filters", description: "Y-strainers, basket filters, cartridge filters and more.", parent: "", status: "active" },
  { id: "pipes-fittings", name: "Pipes & Fittings", description: "Stainless steel, carbon steel, alloy fittings and flanges.", parent: "", status: "active" },
  { id: "instrumentation", name: "Instrumentation", description: "Pressure, temperature, flow and level instruments.", parent: "", status: "active" },
  { id: "electrical", name: "Electrical", description: "Motors, drives, control and automation parts.", parent: "", status: "active" },
  { id: "spare-parts", name: "Spare Parts", description: "Industrial spare parts for various applications.", parent: "", status: "active" },
];

export const MOCK_RFQS = [
  { id: "RFQ-1001", company: "Northwind Energy LLC", contact: "J. Alvarez", country: "United States", product: "Fisher DVC6200 Digital Valve Controller", date: "2026-07-28", status: "new" },
  { id: "RFQ-1000", company: "Al Rashid Trading Co.", contact: "M. Al Rashid", country: "United Arab Emirates", product: "Emerson 3051S Pressure Transmitter", date: "2026-07-25", status: "quoted" },
  { id: "RFQ-0999", company: "PetroSur Servicios", contact: "R. Gomez", country: "Mexico", product: "Flowserve Worcester 44 Ball Valve", date: "2026-07-21", status: "quoted" },
  { id: "RFQ-0998", company: "Baltic Marine Supply", contact: "K. Novak", country: "Poland", product: "Swagelok SS-400-6 Tube Fitting", date: "2026-07-18", status: "closed" },
];

export const MOCK_RECENT_ACTIVITY = [
  { id: 1, action: "Admin session started", time: "Just now" },
  { id: 2, action: "Dashboard viewed", time: "Just now" },
];

// No imports have been run against the live catalog yet — kept as an empty
// list (rendered as an empty state) rather than invented history.
export const MOCK_RECENT_IMPORTS = [];

export const SYSTEM_STATUS = [
  { label: "Website", status: "operational" },
  { label: "RFQ Email (SMTP)", status: "configured" },
  { label: "Product Catalog", status: "empty", note: "0 products imported" },
  { label: "Admin Database", status: "not_connected", note: "Planned for Phase 2" },
];
