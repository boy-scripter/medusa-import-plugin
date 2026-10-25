import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { EVENTS } from "../modules/import/constants"
import { runImportJob } from "../lib/runner"

export default async function handler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
  await runImportJob(container, data.id)
}
export const config: SubscriberConfig = { event: EVENTS.RUN, context: { subscriberId: "product-import-run" } }
