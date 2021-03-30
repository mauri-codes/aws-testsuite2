import { ErrorDescriptor, ErrorPipe } from "../util/errors";

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

export {
   IncorrectLambdaConfiguration,
   NoLambdaFunctionFound
}
