
export type Effect = "Allow" | "Deny"

export interface PolicyStatement {
   Effect: Effect
   Action: string | string[]
   Resource: string | string[]
   Sid?: string
   Principal?: any
   Condition?: any
}

export interface AWSPolicyDocument {
   Statement: PolicyStatement[],
   Version?: string
   Id?: string
}

export interface PolicyTestConfig {
   policyDocument?: AWSPolicyDocument
   policyName?: string
}
