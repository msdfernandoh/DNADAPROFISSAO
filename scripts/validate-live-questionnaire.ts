import { readFileSync } from "node:fs"
import { runPublishChecklist } from "../lib/questionnaire-engine/publish-checklist"
const bundle = JSON.parse(readFileSync(process.argv[2], "utf8"))
const result = runPublishChecklist(bundle)
console.log(JSON.stringify(result, null, 2))
if (!result.canPublish) process.exitCode = 1
