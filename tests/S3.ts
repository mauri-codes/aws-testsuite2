import { TestResult, Test, TestGroup } from "../index"
import { S3Bucket } from "../resources/S3"
import { S3 } from "aws-sdk"
import { AWSResourceGroup } from "../index"
import axios from "axios";

(new S3()).config

class BucketWebsiteEndpointOperational implements Test {
   s3Bucket: S3Bucket
   actions = []
   id: string = BucketWebsiteEndpointOperational.name
   bucketWebsiteUrl: string
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
      let region = s3Bucket.client.config.region
      if (s3Bucket.env?.region) {
         region = s3Bucket.env?.region
      }
      this.bucketWebsiteUrl = `http://${s3Bucket.bucketName}.s3-website.${region}.amazonaws.com`
   }
   async run() {
      let testResult: TestResult = {
         id: this.id,
         success: false
      }
      try {
         await axios.get(this.bucketWebsiteUrl)
         testResult.success = true
      } catch (err) {
         if (err.response.status == 403) {
            testResult.message = "Website not availble, Forbidden 403"
         }
         else {
            testResult.message = "Error"
         }
         testResult.error = err.response.status + ""
      }
      return testResult
   }
}

class BucketPolicyIsPublic implements Test {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPolicyStatus"]
   id: string = BucketPolicyIsPublic.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   async run() {
      let testResult: TestResult = {
         id: this.id,
         success: false
      }
      const params: S3.GetBucketPolicyRequest = {
         Bucket: this.s3Bucket.bucketName
      }
      try {
         let bucketPolicyObject = await this.s3Bucket.client.getBucketPolicyStatus(params).promise()
         if (bucketPolicyObject.PolicyStatus?.IsPublic) {
            testResult.success = true
         }
      } catch (err) {
         if (err.code == 'NoSuchBucketPolicy') {
            testResult.message = "You need to add a Bucket Policy"
         }
         else {
            testResult.message = "Error"
         }
         testResult.error = err.code
      }
      return testResult
   }
}

class BucketWebsiteConfiguration {
   s3Bucket: S3Bucket
   actions = ["S3:GetBucketWebsite"]
   id: string = BucketWebsiteConfiguration.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   async run() {
      let testResult: TestResult = {
         id: this.id,
         success: false
      }
      const params: S3.GetBucketWebsiteRequest = {
         Bucket: this.s3Bucket.bucketName
      }
      try {
         let bucketWebsiteConfig = await this.s3Bucket.client.getBucketWebsite(params).promise()
         let { ErrorDocument, IndexDocument} = bucketWebsiteConfig
         if (ErrorDocument?.Key && IndexDocument?.Suffix) {
            testResult.success = true
         } else {
            throw "_MissingIndexErrorDocuments"
         }
         ErrorDocument.Key
      } catch(err) {
         if( err.code == "NoSuchWebsiteConfiguration") {
            testResult.message = "You need to configure Static Web Hosting"
         } else if (err.code == "_MissingIndexErrorDocuments") {
            testResult.message = "You need to include index and error documents in your website configuration"
         } else {
            testResult.message = "Error"
         }
         testResult.error = err.code
      }
      return testResult
   }
}

class AccessBlockIsPublic implements Test {
   s3Bucket: S3Bucket
   actions = ["s3:GetBucketPublicAccessBlock"]
   id: string = AccessBlockIsPublic.name
   constructor(s3Bucket: S3Bucket) {
      this.s3Bucket = s3Bucket
   }
   async run() {
      let testResult: TestResult = {
         id: this.id,
         success: false
      }
      const params: S3.GetPublicAccessBlockRequest = {
         Bucket: this.s3Bucket.bucketName
      }
      try {
         let accessBlockObject = await this.s3Bucket.client.getPublicAccessBlock(params).promise()
         if (accessBlockObject.PublicAccessBlockConfiguration) {
            let {
               BlockPublicAcls,
               BlockPublicPolicy,
               IgnorePublicAcls,
               RestrictPublicBuckets
            } = accessBlockObject.PublicAccessBlockConfiguration
            if (
               BlockPublicAcls == false &&
               BlockPublicPolicy == false &&
               IgnorePublicAcls == false &&
               RestrictPublicBuckets == false
            ) {
               testResult.success = true
            }
         }
      } catch (err) {
         if (err.code == "NoSuchPublicAccessBlockConfiguration") {
            testResult.success = true
         } else {
            testResult.message = "Error"
            testResult.error = err.code
         }
      }
      return testResult
   }
}

// let myBucket = new S3Bucket('mau-website')
// let myBucket = new S3Bucket('aws-journey.net')

// new AWSResourceGroup([
//    myBucket
// ], {profile: "default", region: "us-east-2"})

// let testGroup = new TestGroup([
//    new BucketPolicyIsPublic(myBucket),
//    new AccessBlockIsPublic(myBucket),
//    new BucketWebsiteConfiguration(myBucket),
//    new BucketWebsiteEndpointOperational(myBucket)
// ])



// let y = async () => {
//    let a = await testGroup.run()
//    console.log("---1----")
//    console.log(a)
//    return true
// }

// y()

export default { BucketPolicyIsPublic, AccessBlockIsPublic, BucketWebsiteConfiguration, BucketWebsiteEndpointOperational }

