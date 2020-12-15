import { AWSResource, Environment } from "../index";
declare class S3Bucket extends AWSResource {
    bucketName: string;
    constructor(bucketName: string, env?: Environment);
}
export { S3Bucket };
//# sourceMappingURL=S3.d.ts.map