// =====================================================================================
// Tourisme Gaspésie - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/tourismegaspesie/ may use this
// file. New client: never built in BigQuery before (no scheduled query, no union_media /
// dashboard). Reads the raw Supermetrics tables of tourismegaspesie_sr_etl,
// and writes ONLY to tourismegaspesie_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "Tourisme Gaspésie";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "tourismegaspesie";

// Raw Supermetrics tables (read only) and the dataset every tourismegaspesie action writes to.
const sourceDataset = "tourismegaspesie_sr_etl";
const outputDataset = "tourismegaspesie_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable tourismegaspesie_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window. Full history starts 2026-01-06.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.tourismegaspesie_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`tourismegaspesie_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-26 (no scheduled query to port): no start date, no campaign exclusion.

// CM360: noise floor (spend, > 10 impressions or > 5 clicks), as for every CM360 client,
// and these sites removed (LOWER(site)).
// Yahoo delivery comes from the yahoo source, so the CM360 Yahoo sites are excluded
// (decided 2026-11-26).
const cm360ExcludedSites = ["yahoo.ca", "yahoo dsp"];

// Yahoo DSP: cost > 0. The raw table carries no account, so it is set here.
const yahooAccountId = "2340";
const yahooAccountName = "Jungle Media Canada";

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-26 Mediabox had no list under this name: every label comes from the
// agency (plusco) lists until the client exists in Mediabox.
const shortcodeClientName = "tourisme gaspésie";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  cm360ExcludedSites,
  yahooAccountId,
  yahooAccountName,
  shortcodeClientName
};
