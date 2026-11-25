// =====================================================================================
// Unibroue - client configuration
// -------------------------------------------------------------------------------------
// Everything specific to this client lives here. Only definitions/unibroue/ may use
// this file. Replaces the BigQuery scheduled query unibroue_dash_ah_last_days, which
// writes unibroue_sr_etl.union_media and unibroue_sr_etl.dash_ah. This pipeline reads
// the same raw Supermetrics tables but writes ONLY to unibroue_dataform, so the
// scheduled query and its tables are untouched while both run side by side.
// =====================================================================================

const client = "Unibroue";

// Dataform tag + BigQuery label carried by every action of this client.
// Schedule this client with a workflow configuration selecting this tag only.
const tag = "unibroue";

// Raw Supermetrics tables (read only) and the dataset every unibroue action writes to.
const sourceDataset = "unibroue_sr_etl";
const outputDataset = "unibroue_dataform";

// -------------------------------------------------------------------------------------
// Processing window
// -------------------------------------------------------------------------------------
// Daily run: last 30 days + today (Toronto time). Steps 1-4 only hold this window; the
// dashboard deletes this window and re-inserts it, older rows are never touched.
//
// Written on the DATE column directly (date >= ...) so BigQuery prunes partitions. The
// old filter DATE(TIMESTAMP(date), "America/Toronto") >= CURRENT_DATE - 31 is exactly
// date >= CURRENT_DATE - 30, because TIMESTAMP(date) is midnight UTC = the previous
// evening in Toronto.
const timezone = "America/Toronto";
const lookbackDays = 30;

// Manual backfill: set the compilation variable unibroue_backfill_start
// (workflow_settings.yaml, or a run-time override) to "YYYY-MM-DD" to rebuild from that
// date. Empty = normal rolling window.
const vars = (dataform.projectConfig && dataform.projectConfig.vars) || {};
const backfillStartDate = (vars.unibroue_backfill_start || "").trim();

if (backfillStartDate && !/^\d{4}-\d{2}-\d{2}$/.test(backfillStartDate)) {
  throw new Error(`unibroue_backfill_start must be YYYY-MM-DD or empty, got "${backfillStartDate}"`);
}

const windowStart = backfillStartDate
  ? `DATE '${backfillStartDate}'`
  : `DATE_SUB(CURRENT_DATE("${timezone}"), INTERVAL ${lookbackDays} DAY)`;

// -------------------------------------------------------------------------------------
// Source filters
// -------------------------------------------------------------------------------------
// Checked 2026-11-24 in the scheduled query unibroue_dash_ah_last_days and the saved
// queries unibroue_union / unibroue_dash_ah: no start date, no campaign exclusion.
// CM360: noise floor (spend, > 10 impressions or > 5 clicks). The queries also write
// AND LOWER(site) <> 'yahoo dsp', but inside the OR parentheses, so it only applies to
// the "clicks > 5" branch and Yahoo DSP is in fact kept: on 2026-11-24 dash_ah held 370
// CM360 "yahoo dsp" rows ($5,883.95 / 7.0M impressions). Unibroue has no Yahoo source,
// so excluding these rows removes that delivery from the dashboard.
// Decision 2026-11-25 (Emmanuelle): exclude Yahoo DSP, as the queries intended.
// Meta: cost > 0.
const cm360ExcludeYahooDsp = true;

// -------------------------------------------------------------------------------------
// Shortcode labels
// -------------------------------------------------------------------------------------
// client_name of this client's lists in the shared Mediabox shortcode table.
const shortcodeClientName = "unibroue";

module.exports = {
  client,
  tag,
  sourceDataset,
  outputDataset,
  timezone,
  lookbackDays,
  backfillStartDate,
  windowStart,
  cm360ExcludeYahooDsp,
  shortcodeClientName
};
