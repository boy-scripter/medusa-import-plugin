"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importPreprocessWorkflow = void 0;
const workflows_sdk_1 = require("@medusajs/framework/workflows-sdk");
const preprocess_csv_1 = require("./steps/preprocess-csv");
exports.importPreprocessWorkflow = (0, workflows_sdk_1.createWorkflow)("import-preprocess-csv", (input) => {
    return new workflows_sdk_1.WorkflowResponse((0, preprocess_csv_1.preprocessCsvStep)(input));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LXByZXByb2Nlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvd29ya2Zsb3dzL2ltcG9ydC1wcmVwcm9jZXNzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHFFQUFvRjtBQUNwRiwyREFBMEQ7QUFFN0MsUUFBQSx3QkFBd0IsR0FBRyxJQUFBLDhCQUFjLEVBQUMsdUJBQXVCLEVBQUUsQ0FBQyxLQUF5QixFQUFFLEVBQUU7SUFDNUcsT0FBTyxJQUFJLGdDQUFnQixDQUFDLElBQUEsa0NBQWlCLEVBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtBQUN2RCxDQUFDLENBQUMsQ0FBQSJ9