import { S3 } from "aws-sdk";
export interface Environment {
    region?: string;
}
declare type AWSService = "S3";
declare type AWSClient = S3;
declare class AWSResource {
    env: Environment | undefined;
    client: AWSClient;
    constructor(service: AWSService, env?: Environment);
}
export { AWSResource };
//# sourceMappingURL=index.d.ts.map