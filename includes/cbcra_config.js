// =====================================================================================
// CBCRA - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/cbcra/ may use this
// file. New client: never built in BigQuery before (no scheduled query, no union_media /
// dashboard). Reads the raw Supermetrics tables of cbcra_sr_etl and the shared MiQ table,
// and writes ONLY to cbcra_dataform (created by Dataform on the first run).
// =====================================================================================

const client = "CBCRA";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "cbcra";

// Raw Supermetrics tables (read only) and the dataset every cbcra action writes to.
const sourceDataset = "cbcra_sr_etl";
const outputDataset = "cbcra_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable cbcra_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window. Full history starts 2026-06-05.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.cbcra_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`cbcra_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
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
// MiQ delivery comes from the MiQ source and Yahoo DSP from the yahoo source, so
// their CM360 rows are excluded (decided 2026-11-26). Amazon DSP may need the same
// exclusion later. "MiQ-YouTube" is kept: YouTube is not in the MiQ social table.
const cm360ExcludedSites = ["miq", "yahoo dsp"];

// Meta: cost > 0.

// Yahoo DSP: cost > 0. The raw table carries no account, so it is set here.
const yahooAccountId = "2340";
const yahooAccountName = "Jungle Media Canada";

// MiQ (social bought through the partner MiQ, shared table partner_miq): only these
// profiles belong to CBCRA. Cost > 0.
const miqProfileIds = [
  "a2_j8eec9hy0scw",                      // Reddit - CBCRA_Jungle+MiQ
  "549160193",                            // Linkedin - CBCRA_Jungle+MiQ
  "268f4312-04fc-4fa6-8929-41c709c47339"  // Snapchat - CBCRA_Jungle+MiQ
];

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
// On 2026-11-26 Mediabox had no list under this name (spelling being fixed in Mediabox):
// labels come from the agency (plusco) lists until the next Mediabox refresh.
const shortcodeClientName = "canadian beverage container recycling association (cbcra)";

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
  miqProfileIds,
  shortcodeClientName
};
