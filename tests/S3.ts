import { TestResult, Test, SuccessFulTest } from "../index"
import { S3Bucket } from "../resources/S3"
import { S3 } from "aws-sdk"
import axios from "axios";
import { CatchTestError, TestError, CatchError } from "../util/errors"
import {
   WebsiteNotAvailableFrom403,
   UnreachableEndpointFromNullResponse,
   BucketPolicyMissingFromAWS,
   BucketPolicyNotPublic,
   MissingIndexErrorDocuments,
   NoSuchWebsiteConfigurationFromAWS,
   NoSuchPublicAccessBlockConfigurationPass,
   AccessBlockConfigurationNotPublic
} from "../errors/S3";

class BucketWebsiteEndpointOperational implements Test {
   s3Bucket: S3Bucket
   actions = []
   id: string = BucketWebsiteEndpointOperational.name
   bucketWebsiteUrl: string
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
      let region = s3Bucket.s3Client.config.region
      if (s3Bucket.environment?.region) {
         region = s3Bucket.environment?.region
      }
      this.bucketWebsiteUrl = s3Bucket.getWebsiteUrl()
   }
   @CatchTestError(BucketWebsiteEndpointOperational.name)
   async run() {
      await this.testPublicEndpoint()
      return SuccessFulTest(this.id)
   }
   @CatchError([
      UnreachableEndpointFromNullResponse,
      WebsiteNotAvailableFrom403
   ])
   async testPublicEndpoint() {
      await axios.get(this.bucketWebsiteUrl)
   }
}

class BucketPolicyIsPublic implements Test {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPolicyStatus"]
   id: string = BucketPolicyIsPublic.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   @CatchTestError(BucketPolicyIsPublic.name)
   async run() {
      await this.checkBucketPolicyStatus()
      return SuccessFulTest(this.id)
   }
   @CatchError([ BucketPolicyMissingFromAWS ])
   async checkBucketPolicyStatus() {
      let bucketPolicyObject = await this.s3Bucket.getBucketPolicyStatus()
      if (!bucketPolicyObject.PolicyStatus?.IsPublic) {
         throw new TestError(BucketPolicyNotPublic())
      }
   }
}

class BucketWebsiteConfiguration {
   s3Bucket: S3Bucket
   actions = ["S3:GetBucketWebsite"]
   id: string = BucketWebsiteConfiguration.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }

   @CatchTestError(BucketWebsiteConfiguration.name)
   async run() {
      await this.checkBucketWebsiteConfig()
      return SuccessFulTest(this.id)
   }

   @CatchError([ NoSuchWebsiteConfigurationFromAWS ])
   async checkBucketWebsiteConfig() {
      let bucketWebsiteConfig = await this.s3Bucket.getBucketWebsite()
      let { ErrorDocument, IndexDocument} = bucketWebsiteConfig
      if (ErrorDocument?.Key == null || IndexDocument?.Suffix == null) {
         throw new TestError(MissingIndexErrorDocuments())
      }
   }
}

class AccessBlockIsPublic implements Test {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPublicAccessBlock"]
   id: string = AccessBlockIsPublic.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }

   @CatchTestError(AccessBlockIsPublic.name)
   async run() {
      await this.checkPublicAccessBlock()
      return SuccessFulTest(this.id)
   }

   @CatchError([ NoSuchPublicAccessBlockConfigurationPass ])
   async checkPublicAccessBlock() {
      let accessBlockObject = await this.s3Bucket.getPublicAccessBlock()
      if (accessBlockObject.PublicAccessBlockConfiguration) {
         let {
            BlockPublicAcls,
            IgnorePublicAcls,
            BlockPublicPolicy,
            RestrictPublicBuckets
         } = accessBlockObject.PublicAccessBlockConfiguration
         if (
            BlockPublicAcls ||
            BlockPublicPolicy ||
            IgnorePublicAcls ||
            RestrictPublicBuckets
         ) {
            throw new TestError(AccessBlockConfigurationNotPublic())
         }
      }
   }
}

export { BucketPolicyIsPublic, AccessBlockIsPublic, BucketWebsiteConfiguration, BucketWebsiteEndpointOperational }
