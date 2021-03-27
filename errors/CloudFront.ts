import { ErrorDescriptor, ErrorPipe } from "../util/errors"

const NoDistributionListError = "_NoDistributionList"
let NoDistributionList: () => ErrorDescriptor =
() => ({
   code: TooManyDistributionsError,
   message: `More than 30 distributions found.`
})
let NoDistributionListFromError: ErrorPipe = {
   errorChecker: (error) => {
      return error == NoDistributionListError
   },
   toError: NoDistributionList()
}


const TooManyDistributionsError = "_TooManyDistributions"
let TooManyDistributions: () => ErrorDescriptor =
() => ({
   code: TooManyDistributionsError,
   message: `More than 30 distributions found.`
})
let TooManyDistributionsFromError: ErrorPipe = {
   errorChecker: (error) => {
      return error == TooManyDistributionsError
   },
   toError: TooManyDistributions()
}


const NoTaggedDistributionError = "_NoTaggedDistribution"
let NoTaggedDistribution: () => ErrorDescriptor =
() => ({
   code: NoTaggedDistributionError,
   message: `No distribution found with tag.`
})
let NoTaggedDistributionFromError: ErrorPipe = {
   errorChecker: (error) => {
      return error == NoTaggedDistributionError
   },
   toError: NoTaggedDistribution()
}


const OnlyOneTaggedDistributtionAllowedError = "_OnlyOneTaggedDistributtionAllowed"
let OnlyOneTaggedDistributtionAllowed: () => ErrorDescriptor =
() => ({
   code: OnlyOneTaggedDistributtionAllowedError,
   message: `More than one distribution tagged.`
})
let OnlyOneTaggedDistributtionAllowedFromError: ErrorPipe = {
   errorChecker: (error) => {
      return error == OnlyOneTaggedDistributtionAllowedError
   },
   toError: OnlyOneTaggedDistributtionAllowed()
}


let CloudFrontNotDefaultCertificate: () => ErrorDescriptor =
() => ({
   code: CloudFrontNotDefaultCertificate.name,
   message: `CloudFront is not your default Certificate Source.`
})


let NoS3WebsiteDomainInCloudFront: (s3Endpoint: string) => ErrorDescriptor =
(s3Endpoint) => ({
   code: NoS3WebsiteDomainInCloudFront.name,
   message: `You need to have an origin in CloudFront for your S3 website endpoint ${s3Endpoint}.`
})


export {
   NoDistributionListFromError,
   NoTaggedDistributionFromError,
   TooManyDistributionsFromError,
   OnlyOneTaggedDistributtionAllowedFromError,
   NoDistributionListError,
   TooManyDistributionsError,
   NoTaggedDistributionError,
   OnlyOneTaggedDistributtionAllowedError,
   NoS3WebsiteDomainInCloudFront,
   CloudFrontNotDefaultCertificate,
   OnlyOneTaggedDistributtionAllowed
}

