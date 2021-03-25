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
   getWebsiteUrl() {
      let region = this.s3Client.config.region
      if (this.environment?.region) {
         region = this.environment?.region
      }
      return `http://${this.bucketName}.s3-website.${region}.amazonaws.com`
   }
   async getBucketPolicyStatus(): Promise<S3.GetBucketPolicyStatusOutput> {
      const params: S3.GetBucketPolicyRequest = {
         Bucket: this.bucketName
      }
      return await this.s3Client.getBucketPolicyStatus(params).promise()
   }
   async getBucketWebsite(): Promise<S3.GetBucketWebsiteOutput> {
      const params: S3.GetBucketWebsiteRequest = {
         Bucket: this.bucketName
      }
      return await this.s3Client.getBucketWebsite(params).promise()
   }
   async getPublicAccessBlock(): Promise<S3.GetPublicAccessBlockOutput> {
      const params: S3.GetPublicAccessBlockRequest = {
         Bucket: this.bucketName
      }
      return await this.s3Client.getPublicAccessBlock(params).promise()
   }
}

export { S3Bucket }
export default { S3Bucket }
