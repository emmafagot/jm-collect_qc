-- =====================================================================================
-- Groupe Marcelle - parity check: Dataform dashboard vs scheduled query dash_ah
-- -------------------------------------------------------------------------------------
-- Read only. Run after a Dataform run, on the window both tables cover.
-- Compares metrics at the platform grain (date x source x level ids). Expected: no row
-- returned, except the known, intended differences:
--   * cm360 rows of site "yahoo dsp": only_in_scheduled_query (now excluded);
--   * tiktok rows: views differ (2-second views, were 0).
-- =====================================================================================

DECLARE start_date DATE DEFAULT DATE_SUB(CURRENT_DATE("America/Toronto"), INTERVAL 30 DAY);

WITH new_df AS (
  -- Dataform output
  SELECT date, data_source, level_1_id, level_2_id, level_3_id,
         ROUND(SUM(media_spend), 2) AS spend,
         SUM(impressions)           AS impressions,
         SUM(clicks)                AS clicks,
         SUM(views)                 AS views,
         SUM(completion_100)        AS completions
  FROM `jm-collect.marcelle_dataform.dashboard`
  WHERE date >= start_date
  GROUP BY ALL
),

old_sq AS (
  -- Scheduled query output (French column names)
  SELECT Date AS date, data_source, level_1_id, level_2_id, level_3_id,
         ROUND(SUM(`Dépense_média`), 2) AS spend,
         SUM(Impressions)               AS impressions,
         SUM(Clics)                     AS clicks,
         SUM(`Vues-Écoutes`)            AS views,
         SUM(`Complétions`)             AS completions
  FROM `jm-collect.marcelle_sr_etl.dash_ah`
  WHERE Date >= start_date
  GROUP BY ALL
)

SELECT
  COALESCE(n.date, o.date)               AS date,
  COALESCE(n.data_source, o.data_source) AS data_source,
  COALESCE(n.level_1_id, o.level_1_id)   AS level_1_id,
  COALESCE(n.level_2_id, o.level_2_id)   AS level_2_id,
  COALESCE(n.level_3_id, o.level_3_id)   AS level_3_id,
  CASE WHEN o.date IS NULL THEN 'only_in_dataform'
       WHEN n.date IS NULL THEN 'only_in_scheduled_query'
       ELSE 'metric_difference' END      AS issue,
  n.spend AS spend_new, o.spend AS spend_old,
  n.impressions AS imps_new, o.impressions AS imps_old,
  n.views AS views_new, o.views AS views_old
FROM new_df n
FULL OUTER JOIN old_sq o
  ON  n.date = o.date AND n.data_source = o.data_source
  AND n.level_1_id = o.level_1_id AND n.level_2_id = o.level_2_id
  AND n.level_3_id = o.level_3_id
WHERE n.date IS NULL OR o.date IS NULL
   OR ABS(n.spend - o.spend) > 0.01
   OR n.impressions != o.impressions
   OR n.clicks      != o.clicks
   OR n.views       != o.views
   OR n.completions != o.completions
ORDER BY issue, date
LIMIT 200;
