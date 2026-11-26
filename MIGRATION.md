# Migrating jm-collect clients to Dataform (Groupe Marcelle model)

How to move a client from its `*_last_days` BigQuery scheduled query to this Dataform
repository, using Groupe Marcelle (`definitions/marcelle`) as the template. Read
`README.md` first for the pipeline shape and the isolation rules.

## Client tracker

| Client | Tag | Scheduled query | Dataset (raw) | Raw tables found | Start date | Custom exclusions | Current final table | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Groupe Marcelle | `marcelle` | `marcelle_dash_ah_last_days` | `marcelle_sr_etl` | CM360, Meta, TikTok, Pinterest, Yahoo DSP, MiQ (shared `partner_miq`, Reddit profile a2_jvm0nh884j56, from 2026-10-29) | none in the saved queries (raw data from 2026-02-01) | CM360: `site <> 'yahoo dsp'` (Yahoo collected separately) | `dash_ah` | **Migrated** - backfilled from 2026-02-01, parity OK 2026-11-24, workflow `marcelle-daily` | Saved queries `marcelle_union` / `marcelle_dash_ah` checked: same clauses. Analytics Hub not repointed yet; scheduled query still running in parallel. MiQ added 2026-11-25 (Dataform only, not in `dash_ah`) |
| Agropur | `agropur` | `agropur_dash_ah_last_days` | `agropur_sr_etl` | CM360, Meta, MiQ (shared `partner_miq`, profiles 1158291872860375 from 2026-11-11 and 2442178479542270 Natrel from 2026-08-24) | none in the saved queries (raw data from 2026-01-15) | none (noise floor only; Yahoo DSP exclusion commented out in all three queries, so kept) | `dash_ah` | **Migrated** - backfilled from 2026-01-15, parity OK 2026-11-24 (0 row-level differences), workflow `agropur-daily` | Three queries checked 2026-11-24: identical clauses. Meta delivery ends 2026-03-04. Analytics Hub not repointed yet; scheduled query still running in parallel. MiQ added 2026-11-25 (Dataform only, not in `dash_ah`); Natrel profile added 2026-11-25, needs a backfill from 2026-08-24 |
| Kombi | `kombi` | `kombi_dash_ah_last_days` | `kombi_sr_etl` | Meta, Meta conversions, TikTok (CM360 table exists but is not read: not in the query, zero-cost rows only) | none in the saved queries (raw data from 2026-03-30) | Meta and TikTok cost > 0; conversions = purchase / add_to_cart / lead | `dash_ah` | **Migrated** - backfilled from 2026-03-30, parity OK 2026-11-25 (Meta 3,298 rows identical; TikTok 864 rows identical except views = 2 s; conversions per type = raw table: 138 purchase, 733 add_to_cart, 6,126 lead, $20,288.25), workflow `kombi-daily` | Conversions as one column per type (`purchase`, `add_to_cart`, `lead`, `purchase_value`, decision 2026-11-25) via `extraMetrics`: `dash_ah` mixed types in one column (purchases 223 instead of 137). TikTok account un-swapped. Saved copy `kombi_dash_ah_last_days` is outdated (no conversions). Analytics Hub not repointed yet (conversion visuals must use the new columns); scheduled query still running in parallel |
| Unibroue | `unibroue` | `unibroue_dash_ah_last_days` | `unibroue_sr_etl` | CM360, Meta | none in the saved queries (raw data from 2026-03-09) | CM360 `site <> 'yahoo dsp'` written but bypassed by AND / OR precedence: Yahoo DSP kept in `dash_ah` (370 rows, $5,884). **Excluded** in Dataform (decision 2026-11-25) | `dash_ah` | **Migrated** - backfilled from 2026-03-09, parity OK 2026-11-25 (CM360 107 rows + Meta 1,140 rows identical; only diff = the 370 excluded Yahoo DSP rows, $5,883.95), workflow `unibroue-daily` | Three queries checked 2026-11-24: same as Agropur except the Yahoo clause. No Yahoo source collected for Unibroue. Analytics Hub not repointed yet; scheduled query still running in parallel |
| Nautilus | `nautilus` | `nautilus_dashboard_last_days` | `nautilus_sr_etl` | Meta, Google Ads L1 | none in the saved queries (raw data from 2026-09-01) | Meta: no cost filter (zero-cost rows kept). Google Ads: cost > 0, types Search / Shopping / Performance Max, 6 old campaigns excluded (`googleAdsExcludedCampaignIds`) | `dashboard` | **Migrated** - backfilled from 2026-09-01, parity OK 2026-11-25 (Google Ads 537 rows + Meta 669 rows identical up to 2026-11-23; later days differ only because the old dashboard was last refreshed 2026-11-24 11:30 UTC, Dataform = raw), workflow `nautilus-daily` | Three queries checked 2026-11-25: same clauses. New step1 `nautilus_step1_googleads_l1` (campaign level, tokens packed in the campaign name). Shortcode client `nautilus plus` has no list: labels from plusco only. Analytics Hub / Looker Studio not repointed yet; scheduled query still running in parallel |
| Cafe William | `cafewilliam` | `cafewilliam_dashboard_last_days` | `cafewilliam_sr_etl` | none in the dataset: MiQ only (shared `partner_miq`, Meta profile 623148979412379 + TikTok profile 7697040583310802962) | none in the query (MiQ data from 2026-08-31) | cost > 0 | `dashboard` | **Migrated** - backfilled from 2026-08-31, parity OK 2026-11-25 (2,198 rows: spend / impressions / clicks / completions identical, $101,270.68; only views differ, 3 s instead of 0), workflow `cafewilliam-daily` | Saved `cafewilliam_union` / `cafewilliam_dashboard` checked: same clauses, but the saved union splits with `jm_tax_split` ("|") while the scheduled query uses `tax_split` ("_"), so the last 30 days of `dashboard` lost the dimensions of the "|"-named campaigns. Dataform uses `jm_tax_split`. Saved copy `cafewilliam_dashboard_last_days` is outdated (Meta profile only). Looker Studio not repointed yet; scheduled query still running in parallel |
| Hubblo | `hubblo` | – (new client, never built in BigQuery) | – (MiQ only) | MiQ (shared `partner_miq`, Meta profile 2151715245664308) | data from 2026-04-08 | cost > 0 | – (`hubblo_dataform.dashboard`) | **Migrated** - backfilled from 2026-04-08, real table = MiQ raw totals 2026-11-26 (106 days, $5,782.93) | Mediabox client `hubblo`. Last delivery 2026-07-23: workflow `hubblo-daily` only if the campaigns resume |
| Trema | `trema` | – (new client, never built in BigQuery) | – (MiQ only) | MiQ (shared `partner_miq`, Meta profile 1455144666629536) | data from 2026-06-16 | cost > 0 | – (`trema_dataform.dashboard`) | **Migrated** - backfilled from 2026-06-16, real table = MiQ raw totals 2026-11-26 (72 days, $14,064.23) | No Mediabox client: labels from plusco. Campaign names do not follow the naming convention. Last delivery 2026-08-28: workflow `trema-daily` only if the campaigns resume |
| Intelcom Dragonfly | `intelcom` | – (new client, never built in BigQuery) | `intelcom_sr_etl` | Google Ads L1, MiQ (shared `partner_miq`: Meta 750579406662348, LinkedIn 526280958, Reddit a2_jnvui4ievjqf) | data from 2026-09-01 (LinkedIn) / 2026-10-01 (Google Ads) | cost > 0; Google Ads Search / Shopping / Performance Max | – (`intelcom_dataform.dashboard`) | **Migrated** - backfilled from 2026-09-01, real table = raw totals for all 6 accounts 2026-11-26 (Google Ads $26,310.82, MiQ $85,699.26) | Mediabox client `intelcom dragonfly` (2 shortcodes). LinkedIn ad set tokens shifted by one. Older LinkedIn ad sets ("LeadGen \| Client awareness \| ...", ~$21k) and some Google Ads campaigns (~$2.9k) are not named with the convention. Workflow `intelcom-daily` |
| CQTS | `cqts` | – (new client, never built in BigQuery) | `cqts_sr_etl` | CM360, MiQ (shared `partner_miq`: Meta 1455316246208040, TikTok 7703976612488380424, Snapchat 5b81a3ce-8560-4225-b364-2c5fc27115a4) | data from 2026-11-02 (CM360) / 2026-11-09 (MiQ) | CM360 noise floor (Yahoo DSP exclusion off, no Yahoo site); MiQ cost > 0 | – (`cqts_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals for all 4 accounts (CM360 $46,789.01, MiQ $3,297.75) | No Mediabox list `cqts`: labels from plusco. CM360 views = 0 in the raw table (completions only). Next: commit, backfill from 2026-11-02, recompile release, workflow `cqts-daily` |
| CBCRA | `cbcra` | – (new client, never built in BigQuery) | `cbcra_sr_etl` | CM360, Meta, Yahoo, MiQ (shared `partner_miq`: Reddit a2_j8eec9hy0scw, LinkedIn 549160193, Snapchat 268f4312-04fc-4fa6-8929-41c709c47339) | data from 2026-06-05 | CM360 noise floor, sites `miq` / `yahoo dsp` excluded; Meta, Yahoo, MiQ cost > 0 | – (`cbcra_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (CM360 $127,761.57, Meta $28,295.83, Yahoo $62,797.69, MiQ $16,722.45) | Mediabox name being fixed ("beverage"), labels from plusco until the refresh. Amazon DSP kept in CM360 (may be excluded later). Yahoo lines without publisher token -> media type Direct. Next: commit, backfill from 2026-06-05, recompile release, workflow `cbcra-daily` |
| HEC Montréal | `hec` | – (new client, never built in BigQuery) | `hec_sr_etl` | Yahoo, MiQ (shared `partner_miq`: Meta 26371786999169911) | data from 2026-05-05 | cost > 0 | – (`hec_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (Yahoo $23,677.08, MiQ $58,762.00) | No Mediabox list `hec montréal`. MiQ platform empty before 2026-09-01 -> publisher `meta`. Yahoo lines without publisher token -> Direct. Next: commit, backfill from 2026-05-05, recompile release, workflow `hec-daily` |
| Tourisme Gaspésie | `tourismegaspesie` | – (new client, never built in BigQuery) | `tourismegaspesie_sr_etl` | CM360, Yahoo | data from 2026-01-06 | CM360 noise floor, sites `yahoo.ca` / `yahoo dsp` excluded; Yahoo cost > 0 | – (`tourismegaspesie_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (CM360 $142,924.87, Yahoo $11,242.91) | No Mediabox list `tourisme gaspésie`. Yahoo lines without publisher token -> Direct. Next: commit, backfill from 2026-01-06, recompile release, workflow `tourismegaspesie-daily` |
| Cozey | `cozey` | – (new client, never built in BigQuery) | `cozey_sr_etl` | CM360, Yahoo (no MiQ profile given) | data from 2026-05-08 | CM360 noise floor (no site excluded); Yahoo cost > 0 | – (`cozey_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (CM360 $0 / 22.4M impressions, Yahoo $530,223.77) | No Mediabox list `cozey inc.`. CM360 = DV360 tracking rows with 0 cost. Yahoo campaign / line names do not follow the naming convention -> no dimensions, media type Direct. Next: commit, backfill from 2026-05-08, recompile release, workflow `cozey-daily` |
| Le Groupe Montoni | `montoni` | – (new client, never built in BigQuery) | `montoni_sr_etl` | Google Ads L1, Yahoo | data from 2026-09-09 | cost > 0; Google Ads every campaign type | – (`montoni_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (Google Ads $4,188.29, Yahoo $9,770.48) | No Mediabox list `le groupe montoni`. Google Ads campaign names miss the first token (targeting details), so every token is one position off (publisher reads `sem` -> Direct). Next: commit, backfill from 2026-09-09, recompile release, workflow `montoni-daily` |
| Bota Bota | `bota` | – (new client, never built in BigQuery) | `bota_sr_etl` | Google Ads L1 (Search / Shopping / PMax), Google Ads L3 (Display / Demand Gen / Video, as in sepaq), TikTok | data from 2026-10-01 | cost > 0; L1 / L3 type lists (no overlap, no double counting) | – (`bota_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals per source (Google Ads L1 $23,866.28, L3 $2,628.74, TikTok $4,245.34) | Mediabox `botabota` (3 shortcodes). Video campaigns / ad groups do not follow the naming convention (L3 publisher reads the language -> Direct). Next: commit, backfill from 2026-10-01, recompile release, workflow `bota-daily` |
| Tourisme Montérégie | `tourismemonteregie` | – (new client, never built in BigQuery) | `tourismemonteregie_sr_etl` | CM360 | data from 2026-05-14 | CM360 noise floor, sites `miq` / `media iq` excluded | – (`tourismemonteregie_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals (CM360 $12,940.96, Pelmorex only) | Mediabox `tourisme montérégie` (2 shortcodes). The `media iq` exclusion removes $26,227 (bulk of the CM360 spend): confirmed as intended 2026-11-26. Next: commit, backfill from 2026-05-14, recompile release, workflow `tourismemonteregie-daily` |
| BPA | `bpa` | – (new client, never built in BigQuery) | `bpa_sr_etl` | Google Ads L1 | data from 2026-10-22 | cost > 0; every campaign type | – (`bpa_dataform.dashboard`) | **Files ready** - simulated backfill = raw totals (Google Ads $3,249.60) | No Mediabox list `bpa`. Next: commit, backfill from 2026-10-22, recompile release, workflow `bpa-daily` |

Raw tables found by `bq ls` on 2026-11-24. A raw table present in the dataset is not
necessarily used: the client's queries decide (step 1). Update the row at each step.

## Reference decisions (Marcelle model)

Structural choices, applied to every client:

* Final table `<tag>_dataform.dashboard`. Each taxonomy dimension appears as
  `<dim>_code` + `<dim>_en` (English Mediabox display name, else the code), plus
  `publisher_code`. No `*_disp` columns. `year` is a STRING.
* `channel_group` values stay in English (`Social`, `Programmatic`, `SEM`, `Direct`).
* Views are chosen per source in step1: CM360 = TrueView else rich-media views, Meta = 3 s,
  TikTok = 2 s, Pinterest = MRC views, Yahoo = 0.
* No `union_media` history: steps 1–4 hold the processing window only.

**Never copied from Marcelle without checking** - these are client-specific and must
come from the client's own queries:

* **Data sources** actually used (not every raw table in the dataset is used).
* **Exclusion clauses** (campaigns, sites, accounts, test rows...). Example: Yahoo DSP
  is excluded from CM360 for Marcelle only because Yahoo is collected separately for
  that client; it is **not** a general rule. Set `cm360ExcludeYahooDsp` (and any other
  filter) per client.
* **Start date** and other customizations (date clauses, publisher overrides, display
  rules, token positions).

## Step by step

### 1. Inventory (read only)

Each client has **three queries** to read, and they can disagree:

| Query | Type | What it tells you |
|---|---|---|
| `<tag>_dash_ah_last_days` (or `_dashboard_last_days`) | scheduled query | sources, filters and exclusions currently applied to the last 30 days |
| `<tag>_union` (or `<tag>_union_media`) | saved query | full-history version of the union: **start date**, historical clauses, customizations |
| `<tag>_dash_ah` (or `<tag>_dashboard`) | saved query | full-history version of the dashboard: start date, exclusions, renaming, display rules |

For each one, note:

* the **data sources** used (CTEs and raw tables);
* the **exclusion clauses** per source (WHERE: campaigns, sites, accounts, `NOT LIKE`,
  `<>`, `NOT IN`), and whether the three queries apply the same ones;
* the **start date** (`date >= '...'` / `date > '...'`) and any other date clause;
* the taxonomy token positions, metric mapping and hard-coded exceptions;
* the known bugs listed at the end of this file.

When the queries disagree, decide with the client owner which behaviour is right and
write it in the tracker.

Reading the scheduled query and the raw tables:

```bash
# Find the scheduled query id
bq ls --transfer_config --transfer_location=northamerica-northeast1 --project_id=jm-collect | grep <tag>
# Read its SQL
bq show --format=prettyjson --transfer_config <transfer config name>
# List the raw tables
bq ls jm-collect:<tag>_sr_etl
```

Reading the saved queries: BigQuery console > Explorer > Saved queries. They are also
stored as single-file Dataform repositories (display name = query name, file
`content.sql`), readable through the Dataform API (`repositories.list`, then
`repositories.readFile?path=content.sql`).

### 2. Create the client files

```bash
# Run from the repo root (Git Bash). Replace <tag> and <Client name>.
cp includes/marcelle_config.js includes/<tag>_config.js
cp -r definitions/marcelle definitions/<tag>
cd definitions/<tag>
for f in marcelle_*; do mv "$f" "${f/marcelle_/<tag>_}"; done
sed -i 's/marcelle/<tag>/g; s/Groupe Marcelle/<Client name>/g' *.sqlx *.js ../../includes/<tag>_config.js
```

Then edit by hand:

* `includes/<tag>_config.js`: client name, datasets, `shortcodeClientName` (the
  client's `client_name` in `mediabox-1cd44.mediabox_2.shortcodes`), the backfill
  variable name (`<tag>_backfill_start`), and **the client's own filters from step 1**
  (e.g. `cm360ExcludeYahooDsp = false` unless the client's queries exclude Yahoo; remove
  the Yahoo settings if the client has no Yahoo source).
* `<tag>_sources.js`: only the client's raw tables.
* `<tag>_step1_<source>.sqlx`: delete the sources the client does not have, add the
  missing ones (copy the closest one), and **check every token position against the
  client's scheduled query**: naming conventions differ between clients.
* `<tag>_step2_union.sqlx`: list exactly the client's step1 models.
* `<tag>_step1_<source>.sqlx` WHERE clauses / `<tag>_step3_cleaning.sqlx`: the client's
  exclusions found in step 1 (source-level filters in step1, cross-source exclusions
  in step3).
* `workflow_settings.yaml`: add `<tag>_backfill_start: ""  # full history: "YYYY-MM-DD"` under `vars` (the comment = start date of the first backfill).
* `README.md`: add the client row. This file: update the tracker.

Steps 3–5 and the lookup need no other change: they contain no client logic.

### 3. Validate locally

```bash
npx -y @dataform/cli@3.0.52 compile   # must end with no graph errors
```

Optional: dry-run the compiled pipeline in BigQuery (no cost, validates column names).

### 4. Commit, push, pull

Commit and push on `main` (GitHub Desktop or git), then **Pull** in the Dataform
workspace `jm-collect_qc_main`.

### 5. First run = backfill

The client's `dashboard` table does not exist yet, so the first run must be a backfill.
The backfill start is the **start date found in the saved queries** (step 1); without
one, the earliest date of the raw tables, never earlier than the raw data. If the saved
queries apply a start date, also put it in the client's step1 filters so a later
backfill cannot go before it.

```sql
-- Earliest date per raw table (pick the backfill start, never earlier than these)
SELECT 'cm360' src, MIN(date) FROM `jm-collect.<tag>_sr_etl.GOOGLECM_CM360_SR`
UNION ALL SELECT 'meta', MIN(date) FROM `jm-collect.<tag>_sr_etl.FBADS_META_SR`
UNION ALL SELECT 'current_dashboard', MIN(Date) FROM `jm-collect.<tag>_sr_etl.dash_ah`;
```

1. In the workspace, set `<tag>_backfill_start: "YYYY-MM-DD"` in `workflow_settings.yaml`
   **without committing**.
2. Start execution > tag `<tag>`. No full refresh.
3. Set the variable back to `""` (or Revert the file).

**Known first-run failure**: when `<tag>_dataform` does not exist yet,
`<tag>_lookup_shortcodes` can fail with "Dataset ... was not found" because it starts
while the dataset is being created. The dataset exists afterwards: rerun the same
backfill and it succeeds.

### 6. Parity check

Compare with the scheduled query table, per source and then per platform row
(date × source × level ids). Template: `validation/marcelle_parity_check.sql`.

```sql
-- Per-source totals, new vs old (read only)
WITH n AS (SELECT data_source, COUNT(*) r, ROUND(SUM(media_spend),2) spend, SUM(impressions) imps, SUM(clicks) clk, SUM(views) vws
           FROM `jm-collect.<tag>_dataform.dashboard` GROUP BY 1),
     o AS (SELECT data_source, COUNT(*) r, ROUND(SUM(`Dépense_média`),2) spend, SUM(Impressions) imps, SUM(Clics) clk, SUM(`Vues-Écoutes`) vws
           FROM `jm-collect.<tag>_sr_etl.dash_ah` GROUP BY 1)
SELECT * FROM n FULL JOIN o USING (data_source) ORDER BY 1;
```

Column names of the old table differ by client (`dash_ah` French names, `dashboard`
English names): adapt the `o` CTE. Every difference must be explained (a deliberate
fix) before going further.

### 7. Schedule

* Release configuration `production` (shared by all clients): branch `main`,
  time zone `America/Toronto`, `30 6 * * *`.
* **Recompile the release first**: a workflow configuration only offers the tags of the
  release's latest compilation. After pushing a new client, open the release
  `production` and click **New compilation**, otherwise the client's tag is missing.
* One workflow configuration per client: `<tag>-daily`, release `production`, tag
  `<tag>` only, time zone `America/Toronto`, after the release and after the
  Supermetrics refresh (e.g. `30 7 * * *`). No full refresh.
* Prefer a service account over a personal account for the workflow (a personal
  account stops the runs if its access changes).

### 8. Switch and clean up

1. Let Dataform and the scheduled query run side by side a few days; rerun the parity
   check.
2. Repoint the visualization (Analytics Hub / Looker Studio) to
   `<tag>_dataform.dashboard`. Column names change: update the report fields.
3. Disable the scheduled query (do not delete it at first). The old tables stay as an
   archive.

## Known bugs to look for in the scheduled queries

Found while porting Marcelle and the cm-collect clients:

* **AND / OR precedence**: `WHERE a OR b OR c AND x AND date >= ...` only applies `x`
  and the date filter to `c`. Effects: exclusions never applied, and the whole history
  re-inserted into `union_media` every day.
* **Positional `UNION ALL`**: a CTE listing two columns in another order swaps them
  (Marcelle Yahoo: inventory / creative grouping). step2 now unions by column name.
* **TikTok**: `account_id` / `account` swapped (business center name in the id);
  `video_views_6s` reading the 2-second metric.
* **Missing date window** on one source: rows re-inserted daily (Loto-Québec Meta:
  977 rows stored 50,918 times).
* **`DATE(TIMESTAMP(date), "America/Toronto") >= CURRENT_DATE - 31`** equals
  `date >= CURRENT_DATE - 30`; the step1 models use the latter so BigQuery prunes
  partitions.
