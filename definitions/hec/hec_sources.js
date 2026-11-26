// =====================================================================================
// HEC Montréal - source declarations (raw Supermetrics tables, read only)
// -------------------------------------------------------------------------------------
// The hec_step1_* files always ref these WITH the schema - ref({schema, name}) -
// because every client dataset has tables with the same names, so a hec step can
// never resolve to another client's table.
// =====================================================================================

[
  "VDSP_YAH_SR"         // Yahoo DSP
].forEach(name => declare({
  database: "jm-collect",
  schema: hec_config.sourceDataset,
  name
}));

// The shared Mediabox shortcode table is declared once in definitions/0_shared and is
// read ONLY through hec_lookup_shortcodes, which filters it to this client first.
// The shared MiQ table is declared there too and filtered on hec_config.miqProfileIds
// in hec_step1_miq.
