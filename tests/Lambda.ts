import { TestResult, Test, SuccessFulTest } from "../index"
import { CatchTestError, TestError } from "../util/errors"
import { LambdaFunction } from "../resources/Lambda"
import {
   IncorrectLambdaConfiguration,
   NoLambdaFunctionFound
} from "../errors/Lambda"

interface LambdaConfig {
   Timeout?: number
   Handler?: string
   MemorySize?: number
}

class LambdaTest {
   lambda: LambdaFunction
   constructor(lambda: LambdaFunction) {
      this.lambda = lambda
   }
   checkResources () {
      if (this.lambda.name == null) {
         throw new TestError(NoLambdaFunctionFound())
      }
   }
}

class LambdaConfigTest extends LambdaTest implements Test {
   id: string = LambdaConfigTest.name
   config: LambdaConfig
   constructor(lambda: LambdaFunction, config: LambdaConfig) {
      super(lambda)
      this.config = config
   }
   @CatchTestError(LambdaConfigTest.name)
   async run(): Promise<TestResult> {
      this.checkResources()
      await this.hasLambdaConfig()
      return SuccessFulTest(this.id)
   }
   async hasLambdaConfig() {
      let lambdaConfig = await this.lambda.getFunctionConfiguration()
      let {Timeout, Handler, MemorySize} = this.config
      this.checkConfig("timeout", Timeout, lambdaConfig?.Timeout)
      this.checkConfig("handler", Handler, lambdaConfig?.Handler)
      this.checkConfig("memory", MemorySize, lambdaConfig?.MemorySize)
   }
   checkConfig(config: string, configReq: string | number | undefined, configFound: string | number | undefined) {
      if (configReq && configReq != configFound) {
         throw new TestError(IncorrectLambdaConfiguration(this.lambda.name, config, configReq, configFound || ""))
      }
   }
}

export { LambdaConfigTest }
