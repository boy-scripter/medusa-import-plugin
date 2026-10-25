import { moduleIntegrationTestRunner } from "@medusajs/test-utils"
import { IMPORT_MODULE } from "../../src/modules/import/constants"
import ImportModuleService from "../../src/modules/import/service"
import { ImportJob } from "../../src/modules/import/models/import-job"
import { ImportBatch } from "../../src/modules/import/models/import-batch"
import { ImportError } from "../../src/modules/import/models/import-error"
import { ImportProductMap } from "../../src/modules/import/models/import-product-map"
import { ImportImageMap } from "../../src/modules/import/models/import-image-map"

jest.setTimeout(60_000)

moduleIntegrationTestRunner<ImportModuleService>({
  moduleName: IMPORT_MODULE,
  moduleModels: [ImportJob, ImportBatch, ImportError, ImportProductMap, ImportImageMap],
  resolve: "./src/modules/import",
  moduleOptions: { prefix_upload: "t", price_list_id: "plist_1", sales_channel_id: "sc_1", shipping_profile_id: "sp_1" },
  testSuite: ({ service }) => {
    describe("import module", () => {
      it("persists jobs and batches (checkpoint data)", async () => {
        const job = await service.createImportJobs({ source: "t", filename: "a.csv" })
        await service.createImportBatches([{ job_id: job.id, idx: 0, part_file_id: "f", start_line: 0, size: 10 }])
        const [b] = await service.listImportBatches({ job_id: job.id })
        expect(b.status).toBe("pending")
        await service.updateImportBatches({ id: b.id, status: "completed" })
        expect((await service.retrieveImportBatch(b.id)).status).toBe("completed")
      })
      it("enforces one map row per (source, product_key)", async () => {
        await service.createImportProductMaps([{ source: "t", product_key: "k", product_id: "prod_1" }])
        await expect(service.createImportProductMaps([{ source: "t", product_key: "k", product_id: "prod_2" }])).rejects.toBeTruthy()
      })
      it("validates options on use", () => expect(service.getOptions().sales_channel_id).toBe("sc_1"))
    })
  },
})
