// =====================================================================================
// Le Groupe Montoni - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The montoni_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a montoni step can
// never resolve to another client's table.
// =====================================================================================

[
  "GOOGLEADS_GADL1_SR", // Google Ads, campaign level
  "VDSP_YAH_SR"         // Yahoo DSP
].forEach(name => declare({
  database: "jm-collect",
  schema: montoni_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through montoni_lookup_shortcodes, which filters it to this client first.
