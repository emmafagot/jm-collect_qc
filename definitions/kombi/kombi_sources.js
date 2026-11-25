// =====================================================================================
// Kombi Sports - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The kombi_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names (FBADS_META_SR...),
// so a kombi step can never resolve to another client's table.
// =====================================================================================

[
  "FBADS_META_SR",     // Meta delivery
  "FBADS_METACONV_SR", // Meta conversions (one row per action type)
  "TIK_TIKTOK_SR"      // TikTok
].forEach(name => declare({
  database: "jm-collect",
  schema: kombi_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through kombi_lookup_shortcodes, which filters it to this client first.
