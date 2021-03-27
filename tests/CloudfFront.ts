import { Test, SuccessFulTest } from "../index"
import { CloudFrontDistribution } from "../resources/CloudFront"
import { S3Bucket } from "../resources/S3";
import { CatchError, CatchTestError, TestError } from "../util/errors"
import {
   CloudFrontNotDefaultCertificate,
   NoDistributionListFromError,
   NoS3WebsiteDomainInCloudFront,
   NoTaggedDistributionFromError,
   OnlyOneTaggedDistributtionAllowedFromError,
   TooManyDistributionsFromError
} from "../errors/CloudFront";


class DistributionHasHTTPSDefaultConfiguration implements Test {
   distribution: CloudFrontDistribution
   id: string = DistributionHasHTTPSDefaultConfiguration.name
   constructor(distribution: CloudFrontDistribution) {
      this.distribution = distribution

   }

   @CatchError([
      OnlyOneTaggedDistributtionAllowedFromError,
      TooManyDistributionsFromError,
      NoTaggedDistributionFromError,
      NoDistributionListFromError
   ])
   async checkViewerCertificate() {
      let viewerCertificate = await this.distribution.getViewerCertificate()
      if (!(viewerCertificate?.CloudFrontDefaultCertificate && viewerCertificate.CertificateSource == "cloudfront")) {
         throw new TestError(CloudFrontNotDefaultCertificate())
      }
   }
   @CatchTestError(DistributionHasHTTPSDefaultConfiguration.name)
   async run() {
      await this.checkViewerCertificate()
      return SuccessFulTest(this.id)
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
   @CatchError([
      OnlyOneTaggedDistributtionAllowedFromError,
      TooManyDistributionsFromError,
      NoTaggedDistributionFromError,
      NoDistributionListFromError
   ])
   async checkOrigins() {
      let origins = await this.distribution.getOrigins()      
      const hasS3Domain = origins?.Items.some(origin =>
         `http://${origin.DomainName}` == this.s3Bucket.getWebsiteUrl() || origin.DomainName == this.s3Bucket.getWebsiteUrl()
      )
      if (!hasS3Domain) {
         throw new TestError(NoS3WebsiteDomainInCloudFront(this.s3Bucket.getWebsiteUrl().split("//")[1]))
      }
   }
   @CatchTestError(DistributionHasS3WebsiteOrigin.name)
   async run() {
      await this.checkOrigins()
      return SuccessFulTest(this.id)
   }
}

export { DistributionHasHTTPSDefaultConfiguration, DistributionHasS3WebsiteOrigin }
