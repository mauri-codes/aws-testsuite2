import { TestResult } from "./index";
import { S3Bucket } from "../resources/S3";
declare function bucketPolicyIsPublic(s3Bucket: S3Bucket): Promise<TestResult>;
declare function accessBlockIsPublic(s3Bucket: S3Bucket): Promise<TestResult>;
export { bucketPolicyIsPublic, accessBlockIsPublic };
//# sourceMappingURL=S3.d.ts.map