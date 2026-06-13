# Upload Exact Date Fallback Design

## Goal

Let the user choose an exact fallback date when uploading media so files without
embedded Apple dates do not automatically appear on the first of the month.

## User Experience

After selecting files, the upload confirmation dialog shows one native date
picker labeled `Date`. It defaults to today's local date. The selected date
applies to the whole batch only when an individual file has no extracted date.

## Data Flow

The client sends the date as a multipart `fallbackDate` field in `YYYY-MM-DD`
format before the file parts. The server validates the format and verifies that
the year, month, and day form a real calendar date. It converts the date to
local noon to avoid date shifts around midnight.

## Compatibility

Embedded photo and video dates continue to take priority. Uploads without a
fallback field remain valid for API compatibility. The old separate
`fallbackYear` and `fallbackMonth` fields are replaced by `fallbackDate`.

## Validation

The upload button is disabled when the date field is empty. The server rejects
malformed or impossible dates with HTTP 400 and an `Invalid upload date` error.

## Testing

Client tests verify that `fallbackDate` is serialized before files. Server tests
cover valid dates, leap days, malformed dates, impossible dates, omitted dates,
and preserving extracted metadata dates.
