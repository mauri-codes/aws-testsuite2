import { ErrorDescriptor, ErrorPipe, AWSError, ResourceError } from "../util/errors";

let IncorrectLambdaConfiguration: (
   lambda: string | undefined,
   config: string,
   configReq: number | string,
   configFound: number | string
) => ErrorDescriptor =
   (lambda, config, configReq, configFound) => ({
      code: IncorrectLambdaConfiguration.name,
      message: `Incorrect lambda configuration for ${lambda}. Expected ${config} to be ${configReq}. Found ${configFound}.`
   })

let NoLambdaFunctionFound: () => ErrorDescriptor =
() => ({
   code: NoLambdaFunctionFound.name,
   message: "No such lambda function"
})

let NoLambdaTriggerFoundForS3: (props: {lambda?: string}) => ErrorDescriptor =
({lambda}) => ({
   code: NoLambdaFunctionFound.name,
   message: `${lambda} Function does not provide an S3 Bucket as Trigger`
})

const ResourceNotFoundException = "ResourceNotFoundException"
let NullFromResourceNotFound:ResourceError = {
   errorChecker: AWSError(ResourceNotFoundException),
   value: null
}

export {
   IncorrectLambdaConfiguration,
   NoLambdaTriggerFoundForS3,
   NoLambdaFunctionFound,
   NullFromResourceNotFound
}