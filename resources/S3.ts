import { AWSResource, Environment } from "../index"
import { S3 } from "aws-sdk";

interface S3BucketInput {
   bucketName?: string
}
class S3Bucket extends AWSResource {
   bucketName: string | undefined
   s3Client: S3
   constructor(bucket: S3BucketInput | undefined, env?: Environment) {
      super("S3", env)
      this.s3Client = this.client as S3
      this.bucketName = bucket?.bucketName
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
         Bucket: this.bucketName || ""
      }
      return await this.s3Client.getBucketPolicyStatus(params).promise()
   }
   async getBucketWebsite(): Promise<S3.GetBucketWebsiteOutput> {
      const params: S3.GetBucketWebsiteRequest = {
         Bucket: this.bucketName || ""
      }
      return await this.s3Client.getBucketWebsite(params).promise()
   }
   async getPublicAccessBlock(): Promise<S3.GetPublicAccessBlockOutput> {
      const params: S3.GetPublicAccessBlockRequest = {
         Bucket: this.bucketName || ""
      }
      return await this.s3Client.getPublicAccessBlock(params).promise()
   }
   async getBucketNotificationConfiguration() {
      const params: S3.GetBucketNotificationConfigurationRequest = {
         Bucket: this.bucketName || ""
      }
      return await this.s3Client.getBucketNotificationConfiguration(params).promise()
   }
}

export { S3Bucket }
export default { S3Bucket }
