import { Module } from "@medusajs/framework/utils"
import ImportModuleService from "./service"
import { IMPORT_MODULE } from "./constants"

export { IMPORT_MODULE }
export default Module(IMPORT_MODULE, { service: ImportModuleService })
