import { accessBlockIsPublic, bucketPolicyIsPublic } from "./S3";
export interface TestResult {
   success: boolean
   message?: string
   error?: string
}

export { accessBlockIsPublic, bucketPolicyIsPublic }

