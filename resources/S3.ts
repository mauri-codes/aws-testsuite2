import { AWSResource, Environment } from "../index"
import { S3 } from "aws-sdk";

class S3Bucket extends AWSResource {
   bucketName: string
   s3Client: S3
   constructor(bucketName: string, env?: Environment) {
      super("S3", env)
      this.s3Client = this.client as S3
      this.bucketName = bucketName
   }
}

export { S3Bucket }
export default { S3Bucket }