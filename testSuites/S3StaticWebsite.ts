import { S3Bucket } from "../resources/S3";
import { CloudFrontDistribution } from "../resources/CloudFront";
import { DistributionHasHTTPSDefaultConfiguration, DistributionHasS3WebsiteOrigin } from "../tests/CloudfFront";
import { AccessBlockIsPublic, BucketPolicyIsPublic, BucketWebsiteConfiguration, BucketWebsiteEndpointOperational } from "../tests/S3";
import { AWSResourceGroup, TestGroup, TestSuite } from "../index";
import { CloudFront } from "aws-sdk";

class S3StaticWebsite extends TestSuite {
    s3BucketName: string
    cloudFrontTag: CloudFront.Tag
    constructor(s3BucketName: string, cloudFrontTag: CloudFront.Tag) {
        super()
        this.s3BucketName = s3BucketName
        this.cloudFrontTag = cloudFrontTag
        const bucket = new S3Bucket(this.s3BucketName)
        const cfDistribution = new CloudFrontDistribution({tag: this.cloudFrontTag})
        this.testGroups = [
            this.s3TestGroup(bucket),
            this.cloudFrontTestGroup(cfDistribution, bucket)
        ]
    }
    s3TestGroup(bucket: S3Bucket) {
        return new TestGroup("S3BucketTests", [
            new BucketPolicyIsPublic(bucket),
            new AccessBlockIsPublic(bucket),
            new BucketWebsiteConfiguration(bucket),
            new BucketWebsiteEndpointOperational(bucket)
        ])
    }
    cloudFrontTestGroup(distribution: CloudFrontDistribution, bucket: S3Bucket) {
        return new TestGroup("CloudFrontTests", [
            new DistributionHasHTTPSDefaultConfiguration(distribution),
            new DistributionHasS3WebsiteOrigin(distribution, bucket)
        ])
    }
}

export { S3StaticWebsite }
