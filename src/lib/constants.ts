// Shared runtime limits.
// The ingest edge function accepts parsed JSON in a single request, so the
// practical upper bound is a few tens of MB. Advertise something we can
// reliably deliver end-to-end rather than the theoretical parser ceiling.
export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB
export const MAX_FILE_MB = Math.round(MAX_FILE_BYTES / 1024 / 1024);
// Server-side row cap — mirrors what dataset-ingest enforces.
export const MAX_INGEST_ROWS = 250_000;