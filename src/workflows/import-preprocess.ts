import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { preprocessCsvStep } from "./steps/preprocess-csv"

export const importPreprocessWorkflow = createWorkflow("import-preprocess-csv", (input: { job_id: string }) => {
  return new WorkflowResponse(preprocessCsvStep(input))
})
