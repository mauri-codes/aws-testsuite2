
export type Effect = "Allow" | "Deny"

export interface PolicyStatement {
   Effect: Effect
   Action: string | string[]
   Resource: string | string[]
   Sid?: string
}

export interface AWSPolicyDocument {
   Statement: PolicyStatement[]
}

export interface PolicyTestConfig {
   policyDocument?: AWSPolicyDocument
   policyName?: String
}
