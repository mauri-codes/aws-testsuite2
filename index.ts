import AWS, {
   S3,
   CloudFront,
   IAM
} from "aws-sdk"

export interface Environment {
   region?: string
   profile?: string
   credentials?: {
      id: string,
      secret: string
   }
}

export interface TestResult {
   success: boolean
   id?: string
   message?: string
   error?: string
}

export type AWSService = "S3" | "CloudFront" | "IAM"

const clients: {
   [key in AWSService]: () => any
} = {
   "S3": () => new S3(),
   "CloudFront": () => new CloudFront(),
   "IAM": () => new IAM()
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
      this.client = clients[this.service]()
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
      } else if (env?.credentials) {
         config.credentials = {
            accessKeyId: env.credentials?.id,
            secretAccessKey: env.credentials.secret
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

const SuccessFulTest: TestResult = {
   success: true
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
   id: string
   constructor(id: string, tests: Test[]) {
      this.id = id
      this.tests = tests
   }
   async run() {
      const testPromises = this.tests.map(test => test.run())
      let result = await Promise.all(testPromises)
      return {
         id: this.id,
         success: result.every(test => test.success),
         tests: result
      }
   }
}

class TestSuite {
   testGroups: TestGroup[] = []
   constructor(testGroups?: TestGroup[]) {
      if (testGroups) {
         this.testGroups = testGroups
      }
   }
   async run() {
      const testGroupPromises = this.testGroups.map(testGroup =>  testGroup.run())
      let result = await Promise.all(testGroupPromises)
      return {
         success: result.every(testGroup => testGroup.success),
         testGroups: result
      }
   }
}

export { AWSResource, AWSResourceGroup, Test, TestGroup, TestSuite, SuccessFulTest }
