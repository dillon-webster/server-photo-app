# Upload Month Fallback Design

## Goal

Allow a user to choose a year and month for an upload batch so photos with missing embedded dates appear in the correct timeline period.

## User Experience

After the user selects or drops one or more photos, show a small confirmation dialog before uploading. The dialog contains:

- A required year field.
- A required month selector.
- An Upload button.
- A Cancel button.

The chosen year and month apply to the entire selected batch. The browser sends them with the files in the multipart upload request.

## Date Rules

The server continues extracting each file's Apple, EXIF, or video creation date first.

- If extraction returns a valid date, preserve it unchanged.
- If extraction returns no valid date, use the first day of the selected month at local noon.
- If no fallback year and month were supplied, preserve the existing behavior and leave `dateTaken` null.

Using noon avoids calendar-day shifts when timestamps are displayed in different time zones. The fallback represents an approximate month, not an exact capture time.

## Validation

The client limits the month to January through December and the year to a reasonable four-digit value.

The server independently validates multipart fields:

- Year must be an integer from 1000 through 9999.
- Month must be an integer from 1 through 12.
- Both fields must be present together or both omitted.

Invalid fallback metadata rejects the request before files are processed.

## Architecture

`UploadButton` owns the pending files and prompt state. It starts the existing upload only after the user confirms a year and month.

The API upload helper appends `fallbackYear` and `fallbackMonth` fields before file parts. The upload route reads those fields, validates them, and passes a fallback timestamp to `processUpload`.

`processUpload` uses the fallback only after normal metadata extraction fails. No database schema changes are required.

## Error Handling

Canceling clears the pending files without uploading. Upload failures continue to use the existing progress/error toast. Invalid server-side fallback metadata returns a clear HTTP 400 error.

## Testing

Automated tests cover:

- Converting a valid year and month into the intended timestamp.
- Rejecting incomplete or invalid fallback values.
- Preserving an extracted date instead of replacing it.
- Applying the fallback when the extracted date is missing.
- Appending fallback fields to the multipart upload request.
