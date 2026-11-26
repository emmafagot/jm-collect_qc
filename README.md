# jm-collect QC – Dataform (one independent pipeline per client)

Replaces the `*_dash_ah_last_days` BigQuery scheduled queries of the jm-collect clients,
one client at a time. Each client is fully independent: its own folder, config file,
Dataform tag, BigQuery label and output dataset. No client action reads another
client's data.

| Client          | Folder                  | Config                        | Tag        | Reads (raw)       | Writes              | Replaces                     |
|-----------------|-------------------------|-------------------------------|------------|-------------------|---------------------|------------------------------|
| Groupe Marcelle | `definitions/marcelle`  | `includes/marcelle_config.js` | `marcelle` | `marcelle_sr_etl` | `marcelle_dataform` | `marcelle_dash_ah_last_days` |
| Agropur         | `definitions/agropur`   | `includes/agropur_config.js`  | `agropur`  | `agropur_sr_etl`  | `agropur_dataform`  | `agropur_dash_ah_last_days`  |
| Unibroue        | `definitions/unibroue`  | `includes/unibroue_config.js` | `unibroue` | `unibroue_sr_etl` | `unibroue_dataform` | `unibroue_dash_ah_last_days` |
| Nautilus Plus   | `definitions/nautilus`  | `includes/nautilus_config.js` | `nautilus` | `nautilus_sr_etl` | `nautilus_dataform` | `nautilus_dashboard_last_days` |
| Kombi Sports    | `definitions/kombi`     | `includes/kombi_config.js`    | `kombi`    | `kombi_sr_etl`    | `kombi_dataform`    | `kombi_dash_ah_last_days`    |
| Café William    | `definitions/cafewilliam` | `includes/cafewilliam_config.js` | `cafewilliam` | `partner_miq` (shared, filtered) | `cafewilliam_dataform` | `cafewilliam_dashboard_last_days` |
| Hubblo          | `definitions/hubblo`    | `includes/hubblo_config.js`   | `hubblo`   | `partner_miq` (shared, filtered) | `hubblo_dataform`   | – (new client)               |
| Trema           | `definitions/trema`     | `includes/trema_config.js`    | `trema`    | `partner_miq` (shared, filtered) | `trema_dataform`    | – (new client)               |
| Intelcom Dragonfly | `definitions/intelcom` | `includes/intelcom_config.js` | `intelcom` | `intelcom_sr_etl` + `partner_miq` (shared, filtered) | `intelcom_dataform` | – (new client) |
| CQTS            | `definitions/cqts`      | `includes/cqts_config.js`     | `cqts`     | `cqts_sr_etl` + `partner_miq` (shared, filtered) | `cqts_dataform`     | – (new client)               |

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

## Decisions (Agropur, 2026-11-25)

* **MiQ source** – `agropur_step1_miq` reads the shared partner table
  `jm-collect.partner_miq.agg_miq_delivery_raw_data` (declared once in
  `definitions/0_shared`), filtered on `agropur_config.miqProfileIds`
  (`1158291872860375`, Meta - Agropur_Jungle+MiQ). Modelled on the MIQ CTE of
  `eplv_dash_ah_last_days` (cm-collect): `data_source = 'miq'`, publisher = platform
  (`meta`), inventory = publisher platform (`unknown` → `Meta`), media type Social.
  Views = 3-second video views (the eplv query leaves them at 0). Not in the
  scheduled query's `dash_ah`, so it is expected only in the Dataform dashboard.

## Decisions (Unibroue, 2026-11-25)

* **Yahoo DSP in CM360** – excluded (`cm360ExcludeYahooDsp = true`), as the scheduled
  query intended (its clause was bypassed by AND / OR precedence). Unibroue has no
  Yahoo source, so this delivery (370 rows / $5,884 in `dash_ah`) leaves the dashboard.

## Decisions (Groupe Marcelle, 2026-11-25)

* **MiQ source** – `marcelle_step1_miq`, same model as Agropur, filtered on
  `marcelle_config.miqProfileIds` (`a2_jvm0nh884j56`, Reddit - Groupe Marcelle
  Inc_Jungle+MiQ): publisher `reddit`, inventory `Reddit`, media type Social. Data from
  2026-10-29. Not in the scheduled query's `dash_ah`.

## Decisions (Kombi Sports, 2026-11-25)

* **Client-specific metrics** – `kombi_config.extraMetrics` adds Meta conversion
  columns to every Kombi step (`media.selectStandardColumns` / `media.sumMetrics` take
  an optional extra-metric list; other clients keep the standard schema).
* **Meta conversions** – one column per action type, named after the type so other
  sources can fill them later: `purchase`, `add_to_cart`, `lead`, plus `purchase_value`. The scheduled query used one `conversions` column
  with a single `Nom_conversion` (MAX), so rows holding several types were summed
  under one name (223 "purchases" instead of 137).
* **TikTok** – same as Groupe Marcelle: views = 2-second views, account un-swapped.

## Decisions (Café William, 2026-11-25)

* **MiQ only** – `cafewilliam_step1_miq` reads the shared MiQ table, filtered on the Meta
  and TikTok profiles of `cafewilliam_config.miqProfileIds`. No other source.
* **Taxonomy split** – `jm_tax_split` ("|") like every jm-collect client. The scheduled
  query used `tax_split` ("_") while the saved `cafewilliam_union` used `jm_tax_split`,
  so its last 30 days lost the dimensions of the campaigns named with "|".
* **Views** – MiQ video views (`action_video_view`); were 0 in the scheduled query.

## Decisions (2026-11-25, MiQ)

* **Agropur** – MiQ profile `2442178479542270` (Meta - Natrel_Jungle+MiQ) added to
  `agropur_config.miqProfileIds` (data 2026-08-24 to 2026-09-18).
* **Hubblo, Trema** – new clients, never built in BigQuery: MiQ is their only source, no
  `<client>_sr_etl` dataset and no scheduled query. Same model as Café William; they
  write only to `<tag>_dataform`. Mediabox client names: `hubblo`; none for Trema yet
  (labels from the plusco lists).

## Decisions (Intelcom Dragonfly, 2026-11-26)

* **New client** – never built in BigQuery (no scheduled query, no `union_media` /
  `dashboard`). Sources: Google Ads L1 (`intelcom_sr_etl.GOOGLEADS_GADL1_SR`, same model
  as Nautilus) and MiQ (Meta, LinkedIn, Reddit profiles of `intelcom_config.miqProfileIds`).
* **MiQ LinkedIn** – LinkedIn ad set names start with one extra token, so every ad set
  token is read one position further for LinkedIn rows (as in the eplv query). Placement
  = token 7 for LinkedIn (the eplv fallback to token 5 is not kept: it returns MIQ-GNL).
* **Google Ads publisher fallback** – `ggl-ads` when the campaign-name token is empty, so
  campaigns not named with the convention keep the SEM media type instead of Direct.

## Decisions (CQTS, 2026-11-26)

* **New client** – never built in BigQuery. Sources: CM360 (`cqts_sr_etl`, same model as
  Unibroue, noise floor; Yahoo DSP exclusion off, no Yahoo site) and MiQ (Meta, TikTok,
  Snapchat profiles of `cqts_config.miqProfileIds`, Meta token positions, no shift).
* **Mediabox** – no `cqts` list yet: labels from the plusco lists.
