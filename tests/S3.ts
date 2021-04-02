import { Test, SuccessFulTest } from "../index"
import { S3Bucket } from "../resources/S3"
import { S3 } from "aws-sdk"
import axios from "axios";
import { CatchTestError, TestError, CatchError, ErrorDescriptor } from "../util/errors"
import {
   WebsiteNotAvailableFrom403,
   UnreachableEndpointFromNullResponse,
   BucketPolicyMissingFromAWS,
   BucketPolicyNotPublic,
   MissingIndexErrorDocuments,
   NoSuchWebsiteConfigurationFromAWS,
   NoSuchPublicAccessBlockConfigurationPass,
   AccessBlockConfigurationNotPublic,
   NoS3BucketFound,
   NoTriggerConfigurationFound
} from "../errors/S3";
import { S3EventType } from "../types/S3.types";

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

class S3Test {
   s3Bucket: S3Bucket
   externalError: ErrorDescriptor | undefined
   constructor(bucket: S3Bucket, error?: ErrorDescriptor) {
      this.s3Bucket = bucket
      this.externalError = error
   }
   checkResources () {
      if (this.s3Bucket.bucketName == null) {
         if (this.externalError != null) {
            throw new TestError(this.externalError)
         }
         throw new TestError(NoS3BucketFound())
      }
   }
}

interface LambdaTriggerConfig {
   eventType: keyof typeof S3EventType
   prefix?: string
   sufix?: string
}
class LambdaTriggerConfiguration extends S3Test implements Test {
   s3Bucket: S3Bucket
   triggerConfig: LambdaTriggerConfig
   id: string = LambdaTriggerConfiguration.name
   constructor(s3Bucket: S3Bucket, triggerConfig: LambdaTriggerConfig, error?: ErrorDescriptor) {
      super(s3Bucket, error)
      this.s3Bucket = s3Bucket
      this.triggerConfig = triggerConfig
   }

   @CatchTestError(LambdaTriggerConfiguration.name)
   async run() {
      this.checkResources()
      await this.hasLambdaTriggerConfiguration()
      return SuccessFulTest(this.id)
   }

   async hasLambdaTriggerConfiguration() {
      let { LambdaFunctionConfigurations } = await this.s3Bucket?.getBucketNotificationConfiguration()
      let test = (event: string[]) => false
      if (this.triggerConfig.eventType === S3EventType.ALL_CREATE) {
         test = (event:string[]) => event.includes('s3:ObjectCreated:*')
      }
      let configFound = LambdaFunctionConfigurations?.some(config => this.checkNotificationConfig(config, test))
      if (!configFound) {
         throw new TestError(NoTriggerConfigurationFound(JSON.stringify(this.triggerConfig)))
      }
   }
   checkNotificationConfig(config: S3.LambdaFunctionConfiguration, eventTest: (event:string[]) => boolean) {
      let eventArrayTest = eventTest(config.Events)
      let sufixTest = true
      let prefixTest = true
      let filterRules = config.Filter?.Key?.FilterRules
      if (this.triggerConfig.prefix) {
         let prefixRule = filterRules?.find(rule => rule.Name === "Prefix")
         prefixTest = prefixRule?.Value === this.triggerConfig.prefix
      }
      if (this.triggerConfig.sufix) {
         let sufixRule = filterRules?.find(rule => rule.Name === "Sufix")
         sufixTest = sufixRule?.Value === this.triggerConfig.sufix
      }
      return eventArrayTest && sufixTest && prefixTest
   }
}

export {
   AccessBlockIsPublic,
   BucketPolicyIsPublic,
   LambdaTriggerConfiguration,
   BucketWebsiteConfiguration,
   BucketWebsiteEndpointOperational
}
