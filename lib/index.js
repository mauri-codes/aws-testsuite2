"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AWSResource = void 0;
var aws_sdk_1 = __importDefault(require("aws-sdk"));
var AWSResource = /** @class */ (function () {
    function AWSResource(service, env) {
        this.env = env;
        if (env && env.region) {
            this.client = new aws_sdk_1.default[service]({ region: env === null || env === void 0 ? void 0 : env.region });
        }
        else {
            this.client = new aws_sdk_1.default[service]();
        }
    }
    return AWSResource;
}());
exports.AWSResource = AWSResource;
var l = new AWSResource("S3");
//# sourceMappingURL=index.js.map