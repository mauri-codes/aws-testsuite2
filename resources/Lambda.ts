import { AWSResource, Environment } from "../index"
import { Lambda } from "aws-sdk"

interface LambdaFunctionProps {
   functionName?: string
   qualifier?: string
}
class LambdaFunction extends AWSResource {
   lambdaClient: Lambda
   qualifier: string
   name: string | undefined
   config: Lambda.FunctionConfiguration | undefined
   constructor({qualifier="$LATEST", functionName}: LambdaFunctionProps, env: Environment) {
      super("Lambda", env)
      this.lambdaClient = this.client as Lambda
      this.qualifier = qualifier
      this.name = functionName
   }
   async getFunctionConfiguration(): Promise<Lambda.FunctionConfiguration | undefined> {
      if (this.config == null) {
         let params = {
            FunctionName: this.name || "",
            Qualifier: this.qualifier
         }
         this.config = (await this.lambdaClient.getFunction(params).promise()).Configuration
      }
      return this.config
   }
}

export { LambdaFunction }
export default { LambdaFunction }
