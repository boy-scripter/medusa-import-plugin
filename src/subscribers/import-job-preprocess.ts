import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { EVENTS } from "../modules/import/constants"
import { importPreprocessWorkflow } from "../workflows/import-preprocess"

export default async function handler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  // failures are persisted on the job by the step itself
  await importPreprocessWorkflow(container).run({ input: { job_id: data.id }, throwOnError: false })
}
export const config: SubscriberConfig = { event: EVENTS.PREPROCESS, context: { subscriberId: "product-import-preprocess" } }
