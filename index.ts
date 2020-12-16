import AWS, { S3, CloudFront } from "aws-sdk"

export interface Environment {
   region?: string
   profile?: string
}

export interface TestResult {
   success: boolean
   id?: string
   message?: string
   error?: string
}

export type AWSService = "S3" | "CloudFront"
export type AWSClient =  S3 | CloudFront

const clients: {
   [key in AWSService]: AWSClient
} = {
   "S3": new S3(),
   "CloudFront": new CloudFront()
}
interface EnvironmentConfig {
   credentials?: {
      secretAccessKey: string
      accessKeyId: string
   },
   region?: string
}

class AWSResource {
   env: Environment | undefined
   client: any
   service: AWSService
   constructor(service: AWSService, env?: Environment) {
      this.service = service
      this.client = clients[this.service]
      const config = this.setupEnvironmentConfig(env)
      this.setUpClient(config)
   }
   setUpClient(config: EnvironmentConfig) {
      if (config.credentials || config.region) {
         this.client = new AWS[this.service](config)
      }
   }
   setupEnvironmentConfig (env?: Environment) {
      this.env = env
      let config: EnvironmentConfig = {}
      if (env?.region) {
         config.region = env.region
      }
      if (env?.profile) {
         const awsCredentials = new AWS.SharedIniFileCredentials({profile: env.profile})
         config.credentials = {
            accessKeyId: awsCredentials.accessKeyId,
            secretAccessKey: awsCredentials.secretAccessKey
         }
      }
      return config
   }
}

class AWSResourceGroup {
   env: Environment | undefined
   resources: AWSResource[] = []
   constructor(resources: AWSResource[], env?: Environment) {
      this.env = env
      this.resources = resources
      if (env?.profile || env?.region) {
         this.applyEnvironment()
      }
   }
   applyEnvironment() {
      this.resources.forEach(resource => {
         if (resource.env == null) {
            let config = resource.setupEnvironmentConfig(this.env)
            resource.setUpClient(config)
         }
      })
   }
}

class Test {
   async run():Promise<TestResult> {
      return {
         success: true
      }
   }
}

class TestGroup {
   tests: Test[] = []
   constructor(tests: Test[]) {
      this.tests = tests
   }
   async run() {
      const testPromises = this.tests.map(test => {
         return test.run()
      })
      let result = await Promise.all(testPromises)
      return result
   }
}

export { AWSResource, AWSResourceGroup, Test, TestGroup }
