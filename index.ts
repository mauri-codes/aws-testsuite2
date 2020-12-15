import AWS, { S3 } from "aws-sdk";

export interface Environment {
   region?: string
}
type AWSService = "S3"
type AWSClient = S3


class AWSResource {
   env: Environment | undefined
   client: AWSClient
   constructor(service: AWSService, env?: Environment) {
      this.env = env
      if (env && env.region) {
         this.client = new AWS[service]({region: env?.region})
      } else {
         this.client = new AWS[service]()
      }
   }
}

let l = new AWSResource("S3")

export { AWSResource }
