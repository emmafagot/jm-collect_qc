# jm-collect QC – Dataform (one independent pipeline per client)

Replaces the `*_dash_ah_last_days` BigQuery scheduled queries of the jm-collect clients,
one client at a time. Each client is fully independent: its own folder, config file,
Dataform tag, BigQuery label and output dataset. No client action reads another
client's data.

| Client          | Folder                  | Config                        | Tag        | Reads (raw)       | Writes              | Replaces                     |
|-----------------|-------------------------|-------------------------------|------------|-------------------|---------------------|------------------------------|
| Groupe Marcelle | `definitions/marcelle`  | `includes/marcelle_config.js` | `marcelle` | `marcelle_sr_etl` | `marcelle_dataform` | `marcelle_dash_ah_last_days` |

## Pipeline (per client)

```
<client>_sources.js            declarations of the client's raw Supermetrics tables
<client>_step1_<source>.sqlx   one per platform: window, source filters, taxonomy split,
                               metric mapping (incl. which metric is "views") -> standard columns
<client>_step2_union.sqlx      UNION ALL of every step1 model, selected BY COLUMN NAME
<client>_lookup_shortcodes     the client's English shortcode labels (+ agency fallback lists)
<client>_step3_cleaning.sqlx   level fallbacks, client exclusions, aggregation
<client>_step4_labels.sqlx     code -> English label, media type, combined completions / views
<client>_step5_dashboard.sqlx  client-facing table "dashboard" (incremental, protected)
```

* Source-specific logic lives only in step1. Steps 2–5 contain no
  `CASE WHEN data_source = ...`, so they are identical from one client to the next.
* Steps 1–4 hold the processing window only and are rebuilt every run (no more
  `union_media` history table).
* The dashboard keeps every taxonomy dimension as `<dim>_code` + `<dim>_en` (English
  display name, the code itself when Mediabox has no label). Schema modelled on
  `cm-collect.aeroportqc_sr_etl.dashboard`, plus `publisher_code`, without `*_disp`.

## Shared files (no client data)

* `includes/media.js` – standard column list, metric helpers, agency labelling rules
  (Cossette programmatic desks, media type).
* `includes/qc_shared.js` + `definitions/0_shared` – location of the shared Mediabox
  shortcode table, read only through each client's `<client>_lookup_shortcodes`.

## Isolation rules

1. Everything client-specific lives in `includes/<tag>_config.js`.
2. Files live in `definitions/<tag>/` and are named `<tag>_...`.
3. Every action has `tags: ["<tag>"]`, the label `client: <tag>`, and a description
   starting `Client: <name>.`
4. Every action writes to the client's own dataset `<tag>_dataform`; every `ref` names
   its schema – `ref({schema, name})` – because all clients have same-named tables.
5. Each client is scheduled by its own workflow configuration selecting its tag only.

## Daily run

Workflow configuration `marcelle-daily`: release configuration on `main`, tag
`marcelle`, every day after the Supermetrics refresh (the scheduled query ran at
11:30 UTC). Do not tick "full refresh" (not needed; the dashboard is protected anyway).

## Backfill (rebuild further back than 30 days)

The window comes from the compilation variable `marcelle_backfill_start`
(`workflow_settings.yaml`). Empty = last 30 days + today.

1. Check how far back the raw tables go (the dashboard deletes everything from the
   chosen date, then rebuilds it from the raw tables):
   ```sql
   SELECT 'cm360' src, MIN(date) FROM `jm-collect.marcelle_sr_etl.GOOGLECM_CM360_SR`
   UNION ALL SELECT 'meta', MIN(date) FROM `jm-collect.marcelle_sr_etl.FBADS_META_SR`
   UNION ALL SELECT 'tiktok', MIN(date) FROM `jm-collect.marcelle_sr_etl.TIK_TIKTOK_SR`
   UNION ALL SELECT 'pinterest', MIN(date) FROM `jm-collect.marcelle_sr_etl.PIA_PIN_SR`
   UNION ALL SELECT 'yahoo', MIN(date) FROM `jm-collect.marcelle_sr_etl.VDSP_YAH_SR`
   ```
2. Copy the dashboard table as a backup (BigQuery console > Copy).
3. Either:
   * **Workspace** – in a Dataform workspace, set `marcelle_backfill_start: "2025-01-01"`
     in `workflow_settings.yaml` **without committing**, Start execution > tag
     `marcelle`, then revert the file; or
   * **Release configuration** – a manual release configuration `marcelle-backfill`
     with the compilation variable override `marcelle_backfill_start=2025-01-01`;
     compile it, then start an execution from it (tag `marcelle`). The daily
     release is never touched.
4. Check monthly totals against the backup.

**First run**: the dashboard table does not exist yet, so the first run must be a
backfill from the earliest date you want in the table.

## Adding a client

1. Copy `includes/marcelle_config.js` → `includes/<tag>_config.js` and set client,
   tag, datasets, filters, shortcode client name.
2. Copy `definitions/marcelle/` → `definitions/<tag>/`, rename files and replace
   `marcelle` (schema, tag, label, names, config variable) everywhere.
3. Keep only the step1 files of the client's sources (check token positions against
   its naming convention) and list them in `<tag>_step2_union.sqlx`.
4. Add `<tag>_backfill_start: ""` to `workflow_settings.yaml`.
5. Run a backfill, then a parity check (`validation/marcelle_parity_check.sql` as a
   template) against the scheduled query before switching the dashboard.

## Decisions (Groupe Marcelle, 2026-11-20)

* **Yahoo DSP in CM360** – excluded (`cm360ExcludeYahooDsp = true`). The scheduled
  query meant to exclude these rows but never did (AND / OR precedence).
* **TikTok views** – 2-second views (`video_watched_2s`); were 0 in the scheduled query.
* **TikTok account** – `account_id` / `account` un-swapped.
