"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Bucket = void 0;
var index_1 = require("../index");
var S3Bucket = /** @class */ (function (_super) {
    __extends(S3Bucket, _super);
    function S3Bucket(bucketName, env) {
        var _this = _super.call(this, "S3", env) || this;
        _this.bucketName = bucketName;
        return _this;
    }
    return S3Bucket;
}(index_1.AWSResource));
exports.S3Bucket = S3Bucket;
//# sourceMappingURL=S3.js.map