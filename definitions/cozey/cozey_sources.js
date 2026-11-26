// =====================================================================================
// Cozey - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The cozey_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a cozey step can
// never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR",  // CM360
  "VDSP_YAH_SR"         // Yahoo DSP
].forEach(name => declare({
  database: "jm-collect",
  schema: cozey_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through cozey_lookup_shortcodes, which filters it to this client first.
