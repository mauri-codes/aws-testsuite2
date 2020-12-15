import { TestResult } from "./index"
import { S3Bucket } from "../resources/S3"
import { S3 } from "aws-sdk"

async function bucketPolicyIsPublic(s3Bucket: S3Bucket) {
   let s3Client = s3Bucket.client
   let testResult: TestResult = {
      success: false
   }
   const params: S3.GetBucketPolicyRequest = {
      Bucket: s3Bucket.bucketName
   }
   const bucketPolicyRequest = s3Client.getBucketPolicyStatus(params).promise()
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

   console.log(testResult)
   return testResult
}

async function accessBlockIsPublic(s3Bucket: S3Bucket) {
   let s3Client = s3Bucket.client
   let testResult: TestResult = {
      success: false
   }
   const params: S3.GetPublicAccessBlockRequest = {
      Bucket: s3Bucket.bucketName
   }
   const accessBlockRequest = s3Client.getPublicAccessBlock(params).promise()
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
         if (err.code = 'NoSuchBucketPolicy') {
            testResult.message = "You need to add a Bucket Policy"
            testResult.error = err.code
         }
         else {
            testResult.message = "Error"
            testResult.error = err.code
         }
      })
   await accessBlockRequest

   console.log(testResult)
   return testResult
}

// let x = new S3Bucket('my-example-bucket-1789')
// AccessBlockIsPublic(x);

export { bucketPolicyIsPublic, accessBlockIsPublic }
export default { bucketPolicyIsPublic, accessBlockIsPublic }

