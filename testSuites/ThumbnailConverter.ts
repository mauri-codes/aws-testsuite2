import { S3Bucket } from "../resources/S3";
import { LambdaTriggerConfiguration } from "../tests/S3";
import { TestGroup, TestSuite } from "../index";
import { Environment } from "../index";
import { LambdaFunction } from "../resources/Lambda";
import { LambdaConfigTest } from "../tests/Lambda";
import { S3EventType } from "../types/S3.types";
import { ErrorDescriptor } from "../util/errors";
import { NoLambdaTriggerFoundForS3 } from "../errors/Lambda";

interface ThumbnailConverterProps {
   thumbnailBucketName: string
   functionName: string
}
class ThumbnailConverter extends TestSuite {
   thumbnailBucketName: string
   functionName: string
   env: Environment | undefined
   constructor({functionName="jn-thumbnail-converter", thumbnailBucketName}: ThumbnailConverterProps, env?: Environment) {
      super()
      this.thumbnailBucketName = thumbnailBucketName
      this.functionName = functionName
      this.env = env
   }
   async run() {
      const thumbnailBucket = new S3Bucket(this.thumbnailBucketName, this.env)
      const lambda = new LambdaFunction({functionName: this.functionName}, this.env)
      let imagesBucketName = await lambda.getS3TriggerBucket()
      let imagesBucket: S3Bucket = new S3Bucket(undefined)
      if (imagesBucketName) {
         imagesBucket = new S3Bucket(imagesBucketName, this.env)
      }      
      this.testGroups = [
         this.lambdaConfiguration(lambda),
         this.bucketsConfiguration(imagesBucket, NoLambdaTriggerFoundForS3({lambda: lambda.name || "Lambda"}))
      ]
      return await super.run()
   }
   lambdaConfiguration(lambda: LambdaFunction) {
      return new TestGroup("lambdaConfiguration", [
         new LambdaConfigTest(lambda, {
            Handler: "handler.handler",
            MemorySize: 128,
            Timeout: 12
         })
      ])
   }
   bucketsConfiguration(imagesBucket: S3Bucket, error?: ErrorDescriptor) {
      return new TestGroup("bucketsConfiguration", [
         new LambdaTriggerConfiguration(imagesBucket, {
            eventType: S3EventType.ALL_CREATE,
            prefix: "images/"
         },
         error
         )
      ])
   }
}

export { ThumbnailConverter }
