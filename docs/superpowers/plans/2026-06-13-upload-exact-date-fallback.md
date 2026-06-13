# Upload Exact Date Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the upload month/year fallback with an exact calendar date.

**Architecture:** The React upload dialog owns a `YYYY-MM-DD` string from a
native date input. Multipart serialization sends that value as `fallbackDate`;
the Fastify route validates it through the existing fallback-date service before
processing files.

**Tech Stack:** React, TypeScript, Fastify, Node test runner

---

### Task 1: Change Multipart Serialization

**Files:**
- Modify: `client/tests/uploadFormData.test.ts`
- Modify: `client/src/uploadFormData.ts`
- Modify: `client/src/api.ts`

- [ ] **Step 1: Write the failing test**

Change the fallback object to `{ date: "2015-10-23" }` and assert that the
first form entry is `["fallbackDate", "2015-10-23"]`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd client && ../node_modules/.bin/tsx --test tests/uploadFormData.test.ts`

Expected: FAIL because `fallbackDate` is not serialized.

- [ ] **Step 3: Write minimal implementation**

Change `UploadDateFallback` to `{ date: string }` and append `fallbackDate`
before all file parts.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd client && ../node_modules/.bin/tsx --test tests/uploadFormData.test.ts`

Expected: PASS.

### Task 2: Validate Exact Dates on the Server

**Files:**
- Modify: `server/tests/uploadDateFallback.test.ts`
- Modify: `server/src/services/uploadDateFallback.ts`
- Modify: `server/src/routes/upload.ts`

- [ ] **Step 1: Write failing parser tests**

Test `2015-10-23`, `2024-02-29`, malformed values, and impossible values such
as `2023-02-29`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd server && ../node_modules/.bin/tsx --test tests/uploadDateFallback.test.ts`

Expected: FAIL because the parser still accepts separate year and month values.

- [ ] **Step 3: Implement exact-date parsing**

Accept one unknown value, require `YYYY-MM-DD`, validate by reconstructing the
local date at noon, and return its timestamp. Update the route field and error.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd server && ../node_modules/.bin/tsx --test tests/uploadDateFallback.test.ts`

Expected: PASS.

### Task 3: Replace the Upload Dialog Inputs

**Files:**
- Modify: `client/src/components/UploadButton.tsx`

- [ ] **Step 1: Store a date string**

Initialize one fallback date from the current local year, month, and day.

- [ ] **Step 2: Render the date picker**

Replace the month select and year input with `<input type="date">`, update the
description to say exact date, and disable upload for an empty value.

- [ ] **Step 3: Pass the exact date**

Call `api.upload(files, { date: fallbackDate }, ...)`.

### Task 4: Verify the Feature

**Files:**
- No additional files

- [ ] **Step 1: Run all automated tests**

Run client and server test suites with `tsx --test`.

- [ ] **Step 2: Run production builds**

Run `npm run build` in both `client` and `server`.

- [ ] **Step 3: Inspect the final diff**

Run `git diff --check` and confirm only the exact-date fallback behavior changed.
