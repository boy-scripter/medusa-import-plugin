"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENTS = exports.STALE_MS = exports.PART_SIZE = exports.BATCH_SIZE = exports.IMPORT_MODULE = void 0;
exports.IMPORT_MODULE = "productImport";
exports.BATCH_SIZE = 10;
exports.PART_SIZE = 500; // products per processed NDJSON part file
exports.STALE_MS = 5 * 60 * 1000; // a "processing" job without heartbeat this long is considered interrupted
exports.EVENTS = { PREPROCESS: "import.job.preprocess", RUN: "import.job.run" };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvaW1wb3J0L2NvbnN0YW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBYSxRQUFBLGFBQWEsR0FBRyxlQUFlLENBQUE7QUFDL0IsUUFBQSxVQUFVLEdBQUcsRUFBRSxDQUFBO0FBQ2YsUUFBQSxTQUFTLEdBQUcsR0FBRyxDQUFBLENBQUMsMENBQTBDO0FBQzFELFFBQUEsUUFBUSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFBLENBQUMsMkVBQTJFO0FBQ3BHLFFBQUEsTUFBTSxHQUFHLEVBQUUsVUFBVSxFQUFFLHVCQUF1QixFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBVyxDQUFBIn0=