// Everything else in the admin panel (Products, Manufacturers, Categories,
// RFQs, Dashboard KPIs) now reads from Supabase — see src/lib/supabase/*.
// This is the one remaining placeholder: there's no audit-log table yet, so
// "recent activity" has nothing real to show.
export const MOCK_RECENT_ACTIVITY = [
  { id: 1, action: "Admin session started", time: "Just now" },
  { id: 2, action: "Dashboard viewed", time: "Just now" },
];
