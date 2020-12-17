import { TestResult, Test, TestGroup, TestSuite } from "../index"
import { CloudFrontDistribution } from "../resources/CloudFront";
import { CloudFront } from "aws-sdk";
import { AWSResourceGroup } from "../index"
import { S3Bucket } from "../resources/S3";
import { BucketPolicyIsPublic, AccessBlockIsPublic, BucketWebsiteConfiguration, BucketWebsiteEndpointOperational } from "../tests/S3";


class DistributionHasHTTPSDefaultConfiguration implements Test {
   distribution: CloudFrontDistribution
   id: string = DistributionHasHTTPSDefaultConfiguration.name
   constructor(distribution: CloudFrontDistribution) {
      this.distribution = distribution

   }
   async run() {
      const result: TestResult = {
         id: this.id,
         success: false
      }
      let checkViewerCertificate = (viewerCertificate: CloudFront.ViewerCertificate | undefined) => {
         const result: TestResult = {
            success: false
         }
         if (viewerCertificate?.CloudFrontDefaultCertificate && viewerCertificate.CertificateSource == "cloudfront") {
            result.success = true
         } else {
            result.error = "_CloudFrontNotDefaultCertificate"
            result.message = "CloudFront is not your default Certificate Source"
         }
         return result

      }
      let distributionDataFunc = (data: CloudFront.Distribution) => {
         let viewerCertificate = data.DistributionConfig.ViewerCertificate
         return checkViewerCertificate(viewerCertificate)
      }
      let distributionSummaryFunc = (data: CloudFront.DistributionSummary) => {
         let viewerCertificate = data.ViewerCertificate
         return checkViewerCertificate(viewerCertificate)
      }
      try {
         let request = await this.distribution.processDistributionData(distributionDataFunc, distributionSummaryFunc)
         request.id = this.id
         return request
      } catch (err) {
         result.message = "Error"
         result.error = err.code
      }
      return result
   }
}

class DistributionHasS3WebsiteOrigin implements Test {
   distribution: CloudFrontDistribution
   s3Bucket: S3Bucket
   id: string = DistributionHasS3WebsiteOrigin.name
   constructor(distribution: CloudFrontDistribution, s3Bucket: S3Bucket) {
      this.distribution = distribution
      this.s3Bucket = s3Bucket
   }
   async run() {
      const result: TestResult = {
         id: this.id,
         success: false
      }
      let checkOrigins = (origins: CloudFront.Origins | undefined) => {
         const result: TestResult = {
            success: false
         }
         const hasS3Domain = origins?.Items.some(origin =>
            `http://${origin.DomainName}` == this.s3Bucket.getWebsiteUrl() || origin.DomainName == this.s3Bucket.getWebsiteUrl()
         )
         if (hasS3Domain) {
            result.success = true
         } else {
            result.error = "_NoS3WebsiteDomainInCloudFront"
            result.message = `You need to have an origin in CloudFront for your S3 website endpoint ${this.s3Bucket.getWebsiteUrl().split("//")[1]}`
         }
         return result

      }
      let distributionDataFunc = (data: CloudFront.Distribution) => {
         let origins = data.DistributionConfig.Origins
         return checkOrigins(origins)
      }
      let distributionSummaryFunc = (data: CloudFront.DistributionSummary) => {
         let origins = data.Origins
         return checkOrigins(origins)
      }
      try {
         let request = await this.distribution.processDistributionData(distributionDataFunc, distributionSummaryFunc)
         request.id = this.id
         return request
      } catch (err) {
         result.message = "Error"
         result.error = err.code
      }
      return result
   }
}

export { DistributionHasHTTPSDefaultConfiguration, DistributionHasS3WebsiteOrigin }
// let cf = new CloudFrontDistribution({tag:{Key: "journey", Value: "s3-website"}})
// let myBucket = new S3Bucket('my-example-bucket-1789')
// // let cf = new CloudFrontDistribution({id: 'E29N9RVZVGRC8Y'})

// new AWSResourceGroup([
//    cf, myBucket
// ])
// let testGroup2 = new TestGroup("s3 Tests", [
//    new BucketPolicyIsPublic(myBucket),
//    new AccessBlockIsPublic(myBucket),
//    new BucketWebsiteConfiguration(myBucket),
//    new BucketWebsiteEndpointOperational(myBucket)
// ])

// let testGroup1 = new TestGroup("cloudFront Tests", [
//    new DistributionHasHTTPSDefaultConfiguration(cf),
//    new DistributionHasS3WebsiteOrigin(cf, myBucket)
// ])

// let testsuite = new TestSuite([
//    testGroup2,
//    testGroup1
// ])

// let y = async () => {
//    let a = await testsuite.run()
//    console.log("---1----")
//    console.log(a)
//    return true
// }

// y()

