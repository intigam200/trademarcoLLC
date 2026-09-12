export const NAV_LINKS = [
  { label: "Home", href: "/#hero" },
  { label: "Products", href: "/products" },
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "Industries", href: "/industries" },
  { label: "About", href: "/#about" },
  { label: "Company", href: "/company" },
  { label: "Contact", href: "/#contact" },
];

// Manufacturers and product categories now live in Supabase (see
// supabase/schema.sql + supabase/seed.sql, and src/lib/supabase/manufacturers.js
// / categories.js) instead of being hardcoded here — every page that used to
// import PRODUCTS/MANUFACTURERS from this file now fetches them live.

export const OEM_FEATURES = [
  { icon: "shield-check", title: "Genuine Products", desc: "We source through manufacturers and authorized supply channels to help ensure product authenticity." },
  { icon: "truck", title: "Worldwide Delivery", desc: "Shipping and logistics coordination to deliver products to your location worldwide." },
  { icon: "headset", title: "Technical Support", desc: "Our team helps match the right product and specification to your application." },
  { icon: "clock", title: "Fast RFQ Response", desc: "Submit your requirements and our team responds promptly with sourcing options." },
];

// `slug` doubles as the anchor on /industries, so the cards on the home page
// can deep-link into the matching block. `photo` is null where we don't have
// a picture yet — the page renders an icon panel in its place rather than a
// gap. `supplies` are drawn from the product categories in Supabase, so the
// page describes the actual catalogue rather than generic capability claims.
export const INDUSTRIES = [
  {
    name: "Oil & Gas",
    slug: "oil-gas",
    desc: "Upstream, midstream and downstream operations",
    icon: "oil-rig",
    photo: null,
    intro: "Upstream, midstream and downstream operations run on equipment rated for high pressure, aggressive media and continuous duty. We source control and isolation valves, process instrumentation and spares against your datasheets and tag numbers.",
    supplies: ["Control Valves", "Safety / Relief Valves", "Pressure Transmitters", "Flow Meters", "Filter Elements"],
  },
  {
    name: "Petrochemical",
    slug: "petrochemical",
    desc: "Refineries and chemical processing plants",
    icon: "factory",
    photo: "petrochemical",
    intro: "Refineries and chemical plants work to tight turnaround windows, where a single missing item holds up a whole shutdown. We source valves, filtration and instrumentation to specification — including equivalents where an original has been discontinued.",
    supplies: ["Globe Valves", "Butterfly Valves", "Coalescing Filters", "Temperature Instruments", "Seals & Gaskets"],
  },
  {
    name: "Mining",
    slug: "mining",
    desc: "Mineral processing and extraction facilities",
    icon: "mining-cart",
    photo: "mining",
    intro: "Extraction and mineral processing sites need components that hold up to abrasion, dust and vibration — and need them quickly, because downtime is measured in lost tonnage. We handle both planned resupply and urgent breakdown requests.",
    supplies: ["Gate Valves", "Y-Strainers", "Electric Motors", "Bearings", "Replacement Parts"],
  },
  {
    name: "Marine",
    slug: "marine",
    desc: "Shipbuilding, offshore and port infrastructure",
    icon: "ship",
    photo: "marine",
    intro: "Shipyards, offshore units and port facilities work to class requirements and fixed dry-dock schedules. We source piping, fittings, valves and electrical equipment for newbuild projects and repair work alike.",
    supplies: ["Butt Weld Fittings", "Flanges", "Check Valves", "Switchgear", "Pump Components"],
  },
  {
    name: "Energy",
    slug: "energy",
    desc: "Power generation and renewable energy",
    icon: "electrical",
    photo: null,
    intro: "Power generation and renewable installations depend on control and protection equipment that performs predictably over long service intervals. We source instrumentation, switchgear and valve components for operation and scheduled maintenance.",
    supplies: ["Control Panels", "Drives", "Pressure Gauges", "Level Instruments", "Valve Components"],
  },
  {
    name: "Manufacturing",
    slug: "manufacturing",
    desc: "Heavy industry and production facilities",
    icon: "gear",
    photo: null,
    intro: "Production facilities keep lines running on predictable spares supply. We source automation components, drives and mechanical parts against your part numbers — original or equivalent, whichever the lead time calls for.",
    supplies: ["Automation Components", "Industrial Controls", "Motor Starters", "Fasteners", "OEM / Equivalent Parts"],
  },
];

export const INDUSTRIES_INFO = [
  { icon: "factory", title: "6 Industries", desc: "Expertise across key sectors" },
  { icon: "globe", title: "Global Supply", desc: "Reliable sourcing worldwide" },
  { icon: "shield-check", title: "Certified Partners", desc: "Quality you can trust" },
];

export const WHY_ITEMS = [
  { title: "Verified Manufacturers", desc: "Every supplier in our network is audited for quality certifications, production capacity and delivery track record." },
  { title: "Fast Quotations", desc: "Submit your inquiry and receive competitive quotes within 24–48 hours from multiple qualified manufacturers." },
  { title: "Competitive Pricing", desc: "Direct relationships with factories across Asia, Europe and the Americas ensure the best pricing for your project." },
  { title: "End-to-End Logistics", desc: "From factory floor to your warehouse — we handle export documentation, freight forwarding and customs clearance." },
];

export const BENEFIT_ITEMS = [
  { icon: "globe", title: "Global Sourcing", desc: "Access to qualified manufacturers across major industrial markets." },
  { icon: "shield-check", title: "Quality & Specification Control", desc: "Products sourced according to required specifications and standards." },
  { icon: "dollar-circle", title: "Competitive Sourcing", desc: "Multiple sourcing options to achieve competitive commercial terms." },
  { icon: "headset", title: "End-to-End Support", desc: "Support from RFQ and supplier communication through procurement and shipment coordination." },
];

export const HERO_TRUST = [
  { title: "Global Sourcing", desc: "Qualified suppliers worldwide" },
  { title: "Product Coverage", desc: "Industrial equipment & components" },
  { title: "RFQ Support", desc: "From specification to supply" },
];

export const REGIONS = [
  { region: "North America", detail: "USA, Canada, Mexico", icon: "earth-americas" },
  { region: "Europe", detail: "Germany, Italy, UK, Spain", icon: "earth-europe" },
  { region: "Middle East", detail: "UAE, Saudi Arabia, Turkey", icon: "earth-europe" },
  { region: "Asia-Pacific", detail: "China, India, South Korea, Japan", icon: "earth-asia" },
];

export const HOW_WE_WORK = [
  { step: "01", icon: "document", title: "Request a Quote", text: "You submit a request for quotation with product specifications." },
  { step: "02", icon: "search", title: "We Source", text: "We source offers from verified manufacturers in our network." },
  { step: "03", icon: "clipboard", title: "Receive Quotes", text: "You receive competitive quotes within 24–48 hours." },
  { step: "04", icon: "box", title: "We Handle the Rest", text: "We handle production follow-up, inspection and international shipping." },
];

export const ABOUT_FEATURES = [
  { icon: "calendar", title: "Founded 2026", desc: "Registered as a Wyoming LLC" },
  { icon: "bar-chart", title: `${INDUSTRIES.length} Industries Served`, desc: "Sourcing across key industrial sectors" },
  { icon: "map-pin", title: "Wyoming, USA", desc: "U.S.-registered and based" },
  { icon: "box", title: "6 Product Categories", desc: "From valves to spare parts" },
];

export const COMPANY_INFO = [
  { label: "Legal Name", value: "TRADEMARCO LLC" },
  { label: "Entity Type", value: "Limited Liability Company (LLC)" },
  { label: "State of Formation", value: "Wyoming, USA" },
  { label: "Formation Date", value: "July 23, 2026" },
];

export const CONTACT_INFO = [
  { label: "Sales", value: "sales@trademarco.com" },
  { label: "WhatsApp", value: "+1 (307) 999-8667", icon: "whatsapp", href: "https://wa.me/13079998667" },
  { label: "Support", value: "support@trademarco.com" },
  { label: "General", value: "info@trademarco.com" },
  { label: "Phone", value: "+1 (307) 999-8667" },
  { label: "Address", value: "30 N Gould St Ste N, Sheridan, SHERIDAN COUNTY, WY 82801 US" },
];
