import { TestResult } from "./index"
import { S3Bucket } from "../resources/S3"
import { S3 } from "aws-sdk"
import { AWSResourceGroup } from "../index"



class BucketPolicyIsPublic {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPolicyStatus"]
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   async run() {
      let testResult: TestResult = {
         success: false
      }
      const params: S3.GetBucketPolicyRequest = {
         Bucket: this.s3Bucket.bucketName
      }
      const bucketPolicyRequest = this.s3Bucket.client
         .getBucketPolicyStatus(params)
         .promise()
         .then((data:S3.GetBucketPolicyStatusOutput) => {
            if (data.PolicyStatus?.IsPublic) {
               testResult.success = true
            }
         })
         .catch(err => {
            console.log(err.code)
            if (err.code = 'NoSuchBucketPolicy') {
               testResult.message = "You need to add a Bucket Policy"
               testResult.error = err.code
            }
            else {
               testResult.message = "Error"
               testResult.error = err.code
            }
         })
      await bucketPolicyRequest
      return testResult
   }
}

class AccessBlockIsPublic {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPublicAccessBlock"]
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   async run() {
      let testResult: TestResult = {
         success: false
      }
      const params: S3.GetPublicAccessBlockRequest = {
         Bucket: this.s3Bucket.bucketName
      }
      const accessBlockRequest = this.s3Bucket.client
         .getPublicAccessBlock(params)
         .promise()
         .then((data:S3.GetPublicAccessBlockOutput) => {
            let configuration = data.PublicAccessBlockConfiguration
            if (
               configuration?.BlockPublicAcls == false &&
               configuration.BlockPublicPolicy == false &&
               configuration.IgnorePublicAcls == false &&
               configuration.RestrictPublicBuckets == false
            ) {
               testResult.success = true
            }
            else {
               testResult.message = "You need to disable all Public Access protections"
            }
         })
         .catch(err => {
            console.log(err.code)
            testResult.message = "Error"
            testResult.error = err.code
         })
      await accessBlockRequest
      return testResult
   }
}

// let myBucket = new S3Bucket('mau-website')
// let myBucket = new S3Bucket('my-example-bucket-1789')

// new AWSResourceGroup([
//    myBucket
// ])


// let y = async () => {
//    let test = new AccessBlockIsPublic(myBucket)
//    let a = await test.run()
//    console.log("---1----")
//    console.log(a)
//    return true
// }

// y()

export { BucketPolicyIsPublic, AccessBlockIsPublic }
export default { BucketPolicyIsPublic, AccessBlockIsPublic }

