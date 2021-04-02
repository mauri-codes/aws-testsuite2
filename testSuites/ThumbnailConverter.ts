import { S3Bucket } from "../resources/S3";
import { LambdaTriggerConfiguration } from "../tests/S3";
import { TestGroup, TestSuite } from "../index";
import { Environment } from "../index";
import { LambdaFunction } from "../resources/Lambda";
import { LambdaConfigTest } from "../tests/Lambda";
import { S3EventType } from "../types/S3.types";
import { CatchInferanceError, ErrorDescriptor } from "../util/errors";
import { NoLambdaTriggerFoundForS3 } from "../errors/Lambda";
import { IAMPolicy, IAMRole } from "../resources/IAM";

interface ThumbnailConverterProps {
   functionName: string
}
class ThumbnailConverter extends TestSuite {
   functionName: string
   env: Environment | undefined
   lambda: LambdaFunction
   lambdaRole: IAMRole
   lambdaPolicy: IAMPolicy
   imagesBucket: S3Bucket
   constructor({functionName="jn-thumbnail-converter"}: ThumbnailConverterProps, env?: Environment) {
      super()
      this.functionName = functionName
      this.env = env
      this.lambda = new LambdaFunction({functionName}, env)
      this.lambdaRole = new IAMRole({})
      this.lambdaPolicy = new IAMPolicy({})
      this.imagesBucket = new S3Bucket({})
   }
   async run() {  
      await this.inferInfrastructure()
      this.testGroups = [
         this.lambdaConfiguration(),
         this.bucketsConfiguration()
      ]
      return await super.run()
   }
   async getLambdaPolicy() {
      let roleArn = await this.lambda.getLambdaRoleArn()
      if (roleArn != null) {
         this.lambdaRole = new IAMRole({roleArn}, this.env)         
         let policies = await this.lambdaRole.getAttachedRolePolicies()
         if (policies != null) {
            let policyArn = policies[0].Arn
            this.lambdaPolicy = new IAMPolicy({policyArn}, this.env)
         }
      }
   }
   async getImagesBucket() {
      let imagesBucketName = await this.lambda.getS3TriggerBucket()
      if (imagesBucketName) {
         this.imagesBucket = new S3Bucket({bucketName: imagesBucketName}, this.env)
      }
   }
   @CatchInferanceError()
   async inferInfrastructure() {
      await Promise.all([
         this.getLambdaPolicy(),
         this.getImagesBucket()
      ])
   }
   lambdaConfiguration() {
      return new TestGroup("lambdaConfiguration", [
         new LambdaConfigTest(this.lambda, {
            Handler: "handler.handler",
            MemorySize: 128,
            Timeout: 12
         })
      ])
   }
   bucketsConfiguration() {
      return new TestGroup("bucketsConfiguration", [
         new LambdaTriggerConfiguration(this.imagesBucket, {
            eventType: S3EventType.ALL_CREATE,
            prefix: "images/"
         },
         NoLambdaTriggerFoundForS3({lambda: this.lambda.name || "Lambda"})
         )
      ])
   }
}

export { ThumbnailConverter }
