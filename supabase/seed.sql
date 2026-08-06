-- ============================================================================
-- Trademarco Global — optional seed data
--
-- Reproduces the manufacturers and categories that are already live on the
-- site today (currently hardcoded in src/data/content.js), so the public
-- site keeps working immediately after you switch it over to Supabase
-- instead of going blank. Safe to re-run (upserts on slug).
--
-- Run after schema.sql. Does NOT insert any products — the catalog starts
-- empty, same as before; add products via the admin panel or the CSV import.
-- ============================================================================

insert into categories (slug, name, description, full_description, image_url, types, status) values
  ('valves', 'Valves', 'Gate, globe, ball, check, butterfly and more.',
   'Industrial valves for controlling, isolating and regulating flow across demanding process applications.',
   '/images/products/valve.png',
   array['Gate Valves','Globe Valves','Ball Valves','Butterfly Valves','Check Valves','Control Valves','Plug Valves','Safety / Relief Valves'],
   'active'),
  ('filters', 'Filters', 'Y-strainers, basket filters, cartridge filters and more.',
   'Filtration equipment and components for process, fluid and industrial applications.',
   '/images/products/filters.png',
   array['Y-Strainers','Basket Strainers','Cartridge Filters','Bag Filters','Duplex Filters','Coalescing Filters','Air / Gas Filters','Filter Elements'],
   'active'),
  ('pipes-fittings', 'Pipes & Fittings', 'Stainless steel, carbon steel, alloy fittings and flanges.',
   'Piping products and fittings for industrial, process and infrastructure applications.',
   '/images/products/pipes.png',
   array['Pipes','Elbows','Tees','Reducers','Flanges','Couplings','Butt Weld Fittings','Forged Fittings'],
   'active'),
  ('instrumentation', 'Instrumentation', 'Pressure, temperature, flow and level instruments.',
   'Industrial measurement and instrumentation equipment for monitoring pressure, temperature, flow and level.',
   '/images/products/instrumentation.png',
   array['Pressure Gauges','Pressure Transmitters','Temperature Instruments','Flow Meters','Level Instruments','Differential Pressure Instruments','Instrument Accessories','Process Sensors'],
   'active'),
  ('electrical', 'Electrical', 'Motors, drives, control and automation parts.',
   'Electrical and automation equipment supporting industrial power, control and process applications.',
   '/images/products/electrical.png',
   array['Electric Motors','Drives','Control Panels','Switchgear','Motor Starters','Automation Components','Electrical Components','Industrial Controls'],
   'active'),
  ('spare-parts', 'Spare Parts', 'Industrial spare parts for various applications.',
   'Industrial spare parts and replacement components for maintenance, repair and operational requirements.',
   '/images/products/spareparts.png',
   array['Replacement Parts','Mechanical Components','Seals & Gaskets','Bearings','Fasteners','Pump Components','Valve Components','OEM / Equivalent Parts'],
   'active')
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, full_description = excluded.full_description,
  image_url = excluded.image_url, types = excluded.types, status = excluded.status;


insert into manufacturers (slug, name, description, logo_url, logo_dark, status) values
  ('abb', 'ABB', 'Global technology leader in electrification and industrial automation.',
   '/images/products/logosm/abb-logo-black-and-white.png', false, 'active'),
  ('emerson', 'Emerson', 'Global provider of automation, measurement and control technologies for process industries.',
   '/images/products/logosm/emerson-electric-logo-black-and-white.png', false, 'active'),
  ('fisher', 'Fisher', 'Control valve and regulator brand widely used in process control applications.',
   null, false, 'active'),
  ('parker', 'Parker', 'Global manufacturer of motion and control technologies, including hydraulics, pneumatics and fluid connectors.',
   '/images/products/logosm/parker.png', false, 'active'),
  ('honeywell', 'Honeywell', 'Diversified technology manufacturer with a strong presence in industrial automation and process instrumentation.',
   '/images/products/logosm/honeywell.png', false, 'active'),
  ('yokogawa', 'Yokogawa', 'Manufacturer specializing in industrial automation, measurement and control instrumentation.',
   '/images/products/logosm/yokogawa.png', false, 'active'),
  ('siemens', 'Siemens', 'Global industrial manufacturer providing automation, electrification and digitalization technologies.',
   '/images/products/logosm/siemens.png', false, 'active'),
  ('swagelok', 'Swagelok', 'Manufacturer of fluid system products including fittings, valves and tubing for critical applications.',
   '/images/products/logosm/images.jpg', false, 'active'),
  ('spirax-sarco', 'Spirax Sarco', 'Specialist manufacturer of steam and thermal energy management solutions.',
   '/images/products/logosm/spirax.png', true, 'active'),
  ('flowserve', 'Flowserve', 'Manufacturer of flow control products, including pumps, valves and seals for industrial applications.',
   '/images/products/logosm/Flowserve.png', false, 'active'),
  ('velan', 'Velan', 'Manufacturer of industrial valves for severe-service and critical applications.',
   '/images/products/logosm/velan.jpg', false, 'active'),
  ('samson', 'Samson', 'Manufacturer of control valves and instrumentation for process automation.',
   '/images/products/logosm/samson.png', false, 'active')
on conflict (slug) do update set
  name = excluded.name, description = excluded.description, logo_url = excluded.logo_url,
  logo_dark = excluded.logo_dark, status = excluded.status;
