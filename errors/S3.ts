import { ErrorDescriptor, ErrorPipe } from "../util/errors";

let WebsiteNotAvailable: () => ErrorDescriptor =
   () => ({
      code: WebsiteNotAvailable.name,
      message: "S3 Website Endpoint not available"
   }
)

let UnreachableEndpoint: (endpoint?: string) => ErrorDescriptor =
   (endpoint) => ({
      code: UnreachableEndpoint.name,
      message: `Unreachable endpoint ${endpoint || ""}`
   }
)

let WebsiteNotAvailableFrom403: ErrorPipe = {
   errorChecker: (error) => {
      return error.response && error.response.status == 403
   },
   toError: WebsiteNotAvailable()
}

let UnreachableEndpointFromNullResponse: ErrorPipe = {
   errorChecker: (error) => {
      return error.response == null
   },
   toError: UnreachableEndpoint()
}

let NoSuchBucketPolicy: () => ErrorDescriptor =
   () => ({
      code: NoSuchBucketPolicy.name,
      message: "Bucket Policy missing"
   }
)

let BucketPolicyMissingFromAWS: ErrorPipe = {
   errorChecker: (error) => {
      return error.code == "NoSuchBucketPolicy"
   },
   toError: UnreachableEndpoint()
}

let BucketPolicyNotPublic: () => ErrorDescriptor =
   () => ({
      code: BucketPolicyNotPublic.name,
      message: "Bucket policy does not allow public access"
   }
)

let NoSuchWebsiteConfiguration: () => ErrorDescriptor =
   () => ({
      code: NoSuchWebsiteConfiguration.name,
      message: "Static Website Hosting is not configured"
   }
)

let NoSuchWebsiteConfigurationFromAWS: ErrorPipe = {
   errorChecker: (error) => {
      return error.code == "NoSuchWebsiteConfiguration"
   },
   toError: UnreachableEndpoint()
}

let MissingIndexErrorDocuments: () => ErrorDescriptor =
   () => ({
      code: MissingIndexErrorDocuments.name,
      message: "No Index or Error files configured in Website configuration"
   }
)

let NoSuchPublicAccessBlockConfiguration: () => ErrorDescriptor =
   () => ({
      code: NoSuchPublicAccessBlockConfiguration.name,
      message: "No public access block configuration for bucket"
   }
)

let NoSuchPublicAccessBlockConfigurationPass: ErrorPipe = {
   errorChecker: (error) => {
      return error.code == "NoSuchPublicAccessBlockConfiguration"
   },
   toError: NoSuchPublicAccessBlockConfiguration(),
   skipThrow: true
}

let AccessBlockConfigurationNotPublic: () => ErrorDescriptor =
   () => ({
      code: AccessBlockConfigurationNotPublic.name,
      message: "Bucket access block configuration is not public"
   }
)

export {
   NoSuchPublicAccessBlockConfigurationPass,
   UnreachableEndpointFromNullResponse,
   NoSuchWebsiteConfigurationFromAWS,
   BucketPolicyMissingFromAWS,
   WebsiteNotAvailableFrom403,
   NoSuchPublicAccessBlockConfiguration,
   AccessBlockConfigurationNotPublic,
   NoSuchWebsiteConfiguration,
   MissingIndexErrorDocuments,
   BucketPolicyNotPublic,
   NoSuchBucketPolicy,
   UnreachableEndpoint,
   WebsiteNotAvailable
}
