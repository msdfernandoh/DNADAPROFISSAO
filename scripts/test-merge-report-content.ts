/**
 * npx tsx scripts/test-merge-report-content.ts
 */
import assert from "node:assert/strict"
import {
  contentValueToText,
  mergeReportContents,
  REPORT_CONTENT_FALLBACK,
  getField,
} from "../lib/questionnaire-engine/merge-report-content"

assert.equal(contentValueToText("text", { text: " Olá " }), "Olá")
assert.equal(contentValueToText("text", { html: "<p>Hi</p>" }), "Hi")

const merged = mergeReportContents(
  [
    {
      section_key: "cover",
      field_key: "report_title",
      content_type: "text",
      content_value: { text: "Título DB" },
      profile_id: null,
      secondary_profile_id: null,
      active: true,
    },
    {
      section_key: "profile_main",
      field_key: "tagline",
      content_type: "text",
      content_value: {},
      profile_id: "p1",
      secondary_profile_id: null,
      active: true,
    },
  ],
  "p1",
  "p2"
)

assert.equal(getField(merged.fields, "cover", "report_title"), "Título DB")
assert.equal(getField(merged.fields, "profile_main", "tagline"), REPORT_CONTENT_FALLBACK)

console.log("merge-report-content: ok")
