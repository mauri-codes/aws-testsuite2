import AWS, {
   CloudFront,
   Lambda,
   IAM,
   STS,
   S3
} from "aws-sdk"

export interface Environment {
   region?: string
   profile?: string
   credentials?: {
      id: string,
      secret: string
   }
}

export interface AWSKeys {
   id: string
   secret: string
}

export interface TestResult {
   success: boolean
   id?: string
   message?: string
   error?: string
}

export type AWSService = "S3" | "CloudFront" | "IAM" | "Lambda"

const clients: {
   [key in AWSService]: () => any
} = {
   "S3": () => new S3(),
   "CloudFront": () => new CloudFront(),
   "IAM": () => new IAM(),
   "Lambda": () => new Lambda()
}
interface EnvironmentConfig {
   credentials?: {
      secretAccessKey: string
      accessKeyId: string
   },
   region?: string
}

class AWSEnvironment {
   region: string | undefined
   profile: string | undefined
   credentials: AWSKeys | undefined
   accountId: string| undefined
   sts: STS
   constructor(env?: Environment) {
      this.region = env?.region
      this.profile = env?.profile
      this.credentials = env?.credentials
      this.sts = new AWS.STS(setupEnvironmentConfig(env || {}))
   }
   async getAccountNumber () {
      if (this.accountId === undefined) {
         let accountInfo: STS.GetCallerIdentityResponse = await this.sts.getCallerIdentity().promise()
         this.accountId = accountInfo.Account
      }
      return this.accountId
   }
}

function setupEnvironmentConfig (environment: Environment) {
   let config: EnvironmentConfig = {}
   if (environment?.region) {
      config.region = environment.region
   }
   if (environment?.profile) {
      const awsCredentials = new AWS.SharedIniFileCredentials({profile: environment.profile})
      config.credentials = {
         accessKeyId: awsCredentials.accessKeyId,
         secretAccessKey: awsCredentials.secretAccessKey
      }
   } else if (environment?.credentials) {
      config.credentials = {
         accessKeyId: environment.credentials?.id,
         secretAccessKey: environment.credentials.secret
      }
   }
   return config
}

class AWSResource {
   environment: AWSEnvironment | undefined
   client: any
   service: AWSService
   constructor(service: AWSService, env?: Environment) {
      this.environment = new AWSEnvironment(env)
      this.service = service
      this.client = clients[this.service]()
      const config = this.setupEnvironmentConfig(this.environment)
      this.setUpClient(config)
   }
   setUpClient(config: EnvironmentConfig) {
      if (config.credentials || config.region) {
         this.client = new AWS[this.service](config)
      }
   }
   setupEnvironmentConfig (environment: AWSEnvironment) {
      let config: EnvironmentConfig = {}
      if (environment?.region) {
         config.region = environment.region
      }
      if (environment?.profile) {
         const awsCredentials = new AWS.SharedIniFileCredentials({profile: environment.profile})
         config.credentials = {
            accessKeyId: awsCredentials.accessKeyId,
            secretAccessKey: awsCredentials.secretAccessKey
         }
      } else if (environment?.credentials) {
         config.credentials = {
            accessKeyId: environment.credentials?.id,
            secretAccessKey: environment.credentials.secret
         }
      }
      return config
   }
}

class AWSResourceGroup {
   env: AWSEnvironment | undefined
   resources: AWSResource[] = []
   constructor(resources: AWSResource[], env?: AWSEnvironment) {
      this.env = new AWSEnvironment(env)
      this.resources = resources
      if (env?.profile || env?.region) {
         this.applyEnvironment(env)
      }
   }
   applyEnvironment(environment: AWSEnvironment) {
      this.resources.forEach(resource => {
         if (resource.environment == null) {
            let config = resource.setupEnvironmentConfig(environment)
            resource.setUpClient(config)
         }
      })
   }
}

const SuccessFulTest: (id: string) => TestResult = 
   (id) => ({
      id,
      success: true
   }
)

class Test {
   id: string
   constructor(id: string) {
      this.id = id
   }
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
      this.tests.forEach((test, index) => {
         result[index].id = test.id
      })
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

export { AWSResource, AWSResourceGroup, Test, TestGroup, TestSuite, SuccessFulTest, AWSEnvironment }
