import { AWSResource, Environment } from "../index";

class S3Bucket extends AWSResource {
   bucketName: string
   constructor(bucketName: string, env?: Environment) {
      super("S3", env)
      this.bucketName = bucketName
   }
}

export { S3Bucket }
export default { S3Bucket }