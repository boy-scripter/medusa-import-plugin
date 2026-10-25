"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.default = handler;
const constants_1 = require("../modules/import/constants");
const runner_1 = require("../lib/runner");
async function handler({ event: { data }, container }) {
    await (0, runner_1.runImportJob)(container, data.id);
}
exports.config = { event: constants_1.EVENTS.RUN, context: { subscriberId: "product-import-run" } };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LWpvYi1ydW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvc3Vic2NyaWJlcnMvaW1wb3J0LWpvYi1ydW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBSUEsMEJBRUM7QUFMRCwyREFBb0Q7QUFDcEQsMENBQTRDO0FBRTdCLEtBQUssVUFBVSxPQUFPLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxTQUFTLEVBQWtDO0lBQ2xHLE1BQU0sSUFBQSxxQkFBWSxFQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7QUFDeEMsQ0FBQztBQUNZLFFBQUEsTUFBTSxHQUFxQixFQUFFLEtBQUssRUFBRSxrQkFBTSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsRUFBRSxZQUFZLEVBQUUsb0JBQW9CLEVBQUUsRUFBRSxDQUFBIn0=