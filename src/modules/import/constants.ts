export const IMPORT_MODULE = "productImport"
export const PART_SIZE = 500 // products per processed NDJSON part file
export const STALE_MS = 5 * 60 * 1000 // a "processing" job without heartbeat this long is considered interrupted
export const EVENTS = { PREPROCESS: "import.job.preprocess", RUN: "import.job.run" } as const
