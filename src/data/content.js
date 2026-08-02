export const NAV_LINKS = [
  { label: "Home", href: "/#hero" },
  { label: "Products", href: "/products" },
  { label: "Manufacturers", href: "/manufacturers" },
  { label: "Industries", href: "/#industries" },
  { label: "About", href: "/#about" },
  { label: "Company", href: "/company" },
  { label: "Contact", href: "/#contact" },
];

export const PRODUCTS = [
  {
    slug: "valves", title: "Valves",
    desc: "Gate, globe, ball, check, butterfly and more.",
    image: "/images/products/valve.png",
    fullDescription: "Industrial valves for controlling, isolating and regulating flow across demanding process applications.",
    types: ["Gate Valves", "Globe Valves", "Ball Valves", "Butterfly Valves", "Check Valves", "Control Valves", "Plug Valves", "Safety / Relief Valves"],
  },
  {
    slug: "filters", title: "Filters",
    desc: "Y-strainers, basket filters, cartridge filters and more.",
    image: "/images/products/filters.png",
    fullDescription: "Filtration equipment and components for process, fluid and industrial applications.",
    types: ["Y-Strainers", "Basket Strainers", "Cartridge Filters", "Bag Filters", "Duplex Filters", "Coalescing Filters", "Air / Gas Filters", "Filter Elements"],
  },
  {
    slug: "pipes-fittings", title: "Pipes & Fittings",
    desc: "Stainless steel, carbon steel, alloy fittings and flanges.",
    image: "/images/products/pipes.png",
    fullDescription: "Piping products and fittings for industrial, process and infrastructure applications.",
    types: ["Pipes", "Elbows", "Tees", "Reducers", "Flanges", "Couplings", "Butt Weld Fittings", "Forged Fittings"],
  },
  {
    slug: "instrumentation", title: "Instrumentation",
    desc: "Pressure, temperature, flow and level instruments.",
    image: "/images/products/instrumentation.png",
    fullDescription: "Industrial measurement and instrumentation equipment for monitoring pressure, temperature, flow and level.",
    types: ["Pressure Gauges", "Pressure Transmitters", "Temperature Instruments", "Flow Meters", "Level Instruments", "Differential Pressure Instruments", "Instrument Accessories", "Process Sensors"],
  },
  {
    slug: "electrical", title: "Electrical",
    desc: "Motors, drives, control and automation parts.",
    image: "/images/products/electrical.png",
    fullDescription: "Electrical and automation equipment supporting industrial power, control and process applications.",
    types: ["Electric Motors", "Drives", "Control Panels", "Switchgear", "Motor Starters", "Automation Components", "Electrical Components", "Industrial Controls"],
  },
  {
    slug: "spare-parts", title: "Spare Parts",
    desc: "Industrial spare parts for various applications.",
    image: "/images/products/spareparts.png",
    fullDescription: "Industrial spare parts and replacement components for maintenance, repair and operational requirements.",
    types: ["Replacement Parts", "Mechanical Components", "Seals & Gaskets", "Bearings", "Fasteners", "Pump Components", "Valve Components", "OEM / Equivalent Parts"],
  },
];

export const MANUFACTURERS = [
  { slug: "abb", name: "ABB", desc: "Global technology leader in electrification and industrial automation.", logo: "/images/products/logosm/abb-logo-black-and-white.png" },
  { slug: "emerson", name: "Emerson", desc: "Global provider of automation, measurement and control technologies for process industries.", logo: "/images/products/logosm/emerson-electric-logo-black-and-white.png" },
  { slug: "fisher", name: "Fisher", desc: "Control valve and regulator brand widely used in process control applications." },
  { slug: "parker", name: "Parker", desc: "Global manufacturer of motion and control technologies, including hydraulics, pneumatics and fluid connectors.", logo: "/images/products/logosm/parker.png" },
  { slug: "honeywell", name: "Honeywell", desc: "Diversified technology manufacturer with a strong presence in industrial automation and process instrumentation.", logo: "/images/products/logosm/honeywell.png" },
  { slug: "yokogawa", name: "Yokogawa", desc: "Manufacturer specializing in industrial automation, measurement and control instrumentation.", logo: "/images/products/logosm/yokogawa.png" },
  { slug: "siemens", name: "Siemens", desc: "Global industrial manufacturer providing automation, electrification and digitalization technologies.", logo: "/images/products/logosm/siemens.png" },
  { slug: "swagelok", name: "Swagelok", desc: "Manufacturer of fluid system products including fittings, valves and tubing for critical applications.", logo: "/images/products/logosm/images.jpg" },
  { slug: "spirax-sarco", name: "Spirax Sarco", desc: "Specialist manufacturer of steam and thermal energy management solutions.", logo: "/images/products/logosm/spirax.png", logoDark: true },
  { slug: "flowserve", name: "Flowserve", desc: "Manufacturer of flow control products, including pumps, valves and seals for industrial applications.", logo: "/images/products/logosm/Flowserve.png" },
  { slug: "velan", name: "Velan", desc: "Manufacturer of industrial valves for severe-service and critical applications.", logo: "/images/products/logosm/velan.jpg" },
  { slug: "samson", name: "Samson", desc: "Manufacturer of control valves and instrumentation for process automation.", logo: "/images/products/logosm/samson.png" },
];

export const OEM_FEATURES = [
  { icon: "shield-check", title: "Genuine Products", desc: "We source through manufacturers and authorized supply channels to help ensure product authenticity." },
  { icon: "truck", title: "Worldwide Delivery", desc: "Shipping and logistics coordination to deliver products to your location worldwide." },
  { icon: "headset", title: "Technical Support", desc: "Our team helps match the right product and specification to your application." },
  { icon: "clock", title: "Fast RFQ Response", desc: "Submit your requirements and our team responds promptly with sourcing options." },
];

export const INDUSTRIES = [
  { name: "Oil & Gas", desc: "Upstream, midstream and downstream operations", icon: "oil-rig" },
  { name: "Petrochemical", desc: "Refineries and chemical processing plants", icon: "factory" },
  { name: "Mining", desc: "Mineral processing and extraction facilities", icon: "mining-cart" },
  { name: "Marine", desc: "Shipbuilding, offshore and port infrastructure", icon: "ship" },
  { name: "Energy", desc: "Power generation and renewable energy", icon: "electrical" },
  { name: "Manufacturing", desc: "Heavy industry and production facilities", icon: "gear" },
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
  { region: "Middle East", detail: "UAE, Saudi Arabia, Turkey", icon: "compass" },
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
  { icon: "box", title: `${PRODUCTS.length} Product Categories`, desc: "From valves to spare parts" },
];

export const COMPANY_INFO = [
  { label: "Legal Name", value: "TradeMarco LLC" },
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
