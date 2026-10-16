// Search Console reports with a delay of roughly two to three days, so ranges
// end three days back rather than today, which would undercount the last days.
function iso(d) {
  return d.toISOString().slice(0, 10);
}

export function gscRange(days = 28, offsetPeriods = 0) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 3 - offsetPeriods * days);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { startDate: iso(start), endDate: iso(end) };
}
