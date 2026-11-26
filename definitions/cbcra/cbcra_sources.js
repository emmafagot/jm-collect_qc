// =====================================================================================
// CBCRA - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The cbcra_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a cbcra step can
// never resolve to another client's table.
// =====================================================================================

[
  "GOOGLECM_CM360_SR",  // CM360
  "FBADS_META_SR",      // Meta
  "VDSP_YAH_SR"         // Yahoo DSP
].forEach(name => declare({
  database: "jm-collect",
  schema: cbcra_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through cbcra_lookup_shortcodes, which filters it to this client first.
// The shared MiQ table is declared there too and filtered on cbcra_config.miqProfileIds
// in cbcra_step1_miq.
