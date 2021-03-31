import { AWSResource, Environment } from "../index"
import { Lambda, S3 } from "aws-sdk"
import { AWSPolicyDocument } from "../types/IAM.types"
import { CatchResourceError } from "../util/errors"
import { NullFromResourceNotFound } from "../errors/Lambda"
import { S3Bucket } from "./S3"


interface LambdaFunctionProps {
   functionName?: string
   qualifier?: string
}
const LATEST = "$LATEST"
class LambdaFunction extends AWSResource {
   lambdaClient: Lambda
   qualifier: string
   name: string | undefined
   config: Lambda.FunctionConfiguration | undefined
   policy: AWSPolicyDocument | undefined | null
   s3Triggers: S3.LambdaFunctionConfiguration[] | undefined | null
   s3TriggerBucket: S3Bucket | undefined
   env: Environment
   constructor({qualifier=LATEST, functionName}: LambdaFunctionProps, env: Environment) {
      super("Lambda", env)
      this.env = env
      this.lambdaClient = this.client as Lambda
      this.qualifier = qualifier
      this.name = functionName
   }
   async getFunctionConfiguration(): Promise<Lambda.FunctionConfiguration | undefined> {
      if (this.config === undefined) {
         let params = {
            FunctionName: this.name || "",
            Qualifier: this.qualifier
         }
         this.config = (await this.lambdaClient.getFunction(params).promise()).Configuration
      }
      return this.config
   }
   async getLambdaPolicyDocument(): Promise<AWSPolicyDocument | undefined | null> {
      if (this.policy === undefined) {
         let policyRequest = await this.getPolicy()         
         if (policyRequest) {
            let strPolicyDocument = policyRequest.Policy
            this.policy = JSON.parse(decodeURIComponent(strPolicyDocument || ""))
         } else {
            this.policy = null
         }
      }
      return this.policy
   }
   async getS3Triggers() {
      if (this.s3Triggers === undefined) {
         let s3Bucket = await this.getS3TriggerBucket()
         if (s3Bucket != null) {
            this.s3TriggerBucket = new S3Bucket(s3Bucket, this.env)
            this.s3Triggers = (await this.s3TriggerBucket.getBucketNotificationConfiguration()).LambdaFunctionConfigurations
         } else {
            this.s3Triggers = null
         }
      }
      return this.s3Triggers
   }
   async getS3TriggerBucket(): Promise<string | null> {
      let policyDocument = await this.getLambdaPolicyDocument()
      if (policyDocument == null) {
         return null
      }
      let [ statement ] = policyDocument?.Statement
      let s3Service = statement.Principal.Service === 's3.amazonaws.com'
      let action = statement.Action === 'lambda:InvokeFunction'
      if (!s3Service || !action) {
         return null
      }
      let bucketArn = statement.Condition.ArnLike['AWS:SourceArn'] as string
      return bucketArn.split(":").pop() || null
   }
   @CatchResourceError([NullFromResourceNotFound])
   async getPolicy(): Promise<Lambda.GetPolicyResponse | null> {
      let params = {
         FunctionName: this.name || "",
         Qualifier: (this.qualifier === LATEST)? undefined : this.qualifier
      }
      return await this.lambdaClient.getPolicy(params).promise()
   }
}

export { LambdaFunction }
export default { LambdaFunction }
