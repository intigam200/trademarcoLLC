// Turns real Search Console rows into prioritised opportunities. Nothing here
// estimates search volume or competitor positions — every number is one Google
// reported for this site.
//
// rows: [{ keys: [queryOrPage], clicks, impressions, ctr, position }]

// Typical CTR by position band, used only as a comparison baseline inside this
// site's own data: a query is "low CTR" when it earns well under the median
// CTR of this site's other queries at a similar position.
function bandOf(position) {
  if (position <= 3) return "1-3";
  if (position <= 10) return "4-10";
  if (position <= 20) return "11-20";
  return "21+";
}

function median(values) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function totals(rows) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const weightedPos = rows.reduce((s, r) => s + r.position * r.impressions, 0);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : 0, position: impressions ? weightedPos / impressions : 0 };
}

export function findOpportunities(rows, { previousRows = [], minImpressions = 50 } = {}) {
  const byBand = {};
  for (const r of rows) {
    if (r.impressions < minImpressions) continue;
    (byBand[bandOf(r.position)] ||= []).push(r.ctr);
  }
  const bandMedian = Object.fromEntries(Object.entries(byBand).map(([b, v]) => [b, median(v)]));
  const prev = new Map(previousRows.map((r) => [r.keys[0], r]));
  const out = [];

  for (const r of rows) {
    const key = r.keys[0];
    if (r.impressions >= minImpressions) {
      const m = bandMedian[bandOf(r.position)];
      if (m && byBand[bandOf(r.position)].length >= 3 && r.ctr < m * 0.5) {
        out.push({ type: "low_ctr", key, row: r, detail: `CTR ${(r.ctr * 100).toFixed(1)}% vs ${(m * 100).toFixed(1)}% median for this site's queries at a similar position`, action: "Rewrite the title and meta description to match what the searcher is looking for." });
      }
      if (r.position > 10 && r.position <= 20) {
        out.push({ type: "striking_distance", key, row: r, detail: `Average position ${r.position.toFixed(1)} with ${r.impressions} impressions`, action: "Strengthen the page: more specific content, internal links from related pages." });
      }
      if (r.clicks === 0 && r.position <= 10) {
        out.push({ type: "no_clicks", key, row: r, detail: `${r.impressions} impressions on page one, no clicks`, action: "Check the snippet: does the title say what the page offers?" });
      }
    }
    const p = prev.get(key);
    if (p && p.clicks >= 5 && r.clicks < p.clicks * 0.6) {
      out.push({ type: "declining", key, row: r, detail: `Clicks ${p.clicks} → ${r.clicks} vs the previous period`, action: "Compare the page and its snippet with the earlier period; check for indexing or content changes." });
    }
  }
  const weight = { low_ctr: 3, no_clicks: 3, declining: 2, striking_distance: 1 };
  return out.sort((a, b) => weight[b.type] - weight[a.type] || b.row.impressions - a.row.impressions);
}
