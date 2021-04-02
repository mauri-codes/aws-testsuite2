import { AWSResource, Environment } from "../index"
import { IAM, Request } from "aws-sdk";
import { CatchError, CatchTestError } from "../util/errors";
import { AWSPolicyDocument } from "../types/IAM.types";

class IAMResource extends AWSResource {
   iamClient: IAM
   constructor(env?: Environment) {
      super("IAM", env)
      this.iamClient = this.client as IAM
   }
}

class IAMGroup extends IAMResource {
   groupName: string
   groupData: IAM.User[] | undefined
   groupManagedPolicies: IAM.Policy[] | undefined
   constructor(groupName: string, env?: Environment) {
      super(env)
      this.groupName = groupName
   }
   async getGroup(): Promise<IAM.User[]> {
      if (this.groupData == undefined) {
         this.groupData = (await this.iamClient.getGroup({
            GroupName: this.groupName
         }).promise()).Users
      }
      return this.groupData
   }
   async getGroupManagedPolicies (): Promise<IAM.Policy[]> {
      if (this.groupManagedPolicies == undefined) {
         this.groupManagedPolicies = (await this.iamClient.listAttachedGroupPolicies({
            GroupName: this.groupName
         }).promise()).AttachedPolicies
      }
      return this.groupManagedPolicies || []
   }
}

interface RoleInput {
   roleArn?: string
   roleName?: string
}

class IAMRole extends IAMResource {
   roleArn: string | undefined
   roleName: string | undefined
   roleData: IAM.Role | undefined
   managedPolicies: IAM.Policy[] | undefined | null
   constructor(roleInput: RoleInput, env?: Environment) {
      super(env)
      this.roleArn = roleInput.roleArn
      this.roleName = roleInput.roleName
   }
   async getAttachedRolePolicies() {
      if (this.managedPolicies == undefined) {         
         let attachedPolicies = (await this.iamClient.listAttachedRolePolicies({RoleName: this.getRoleName()}).promise()).AttachedPolicies
         if (attachedPolicies == null || attachedPolicies.length === 0) {
            this.managedPolicies = null
         } else {
            this.managedPolicies = attachedPolicies
         }
      }
      return this.managedPolicies
   }
   roleNameFromArn(roleArn: string) {
      let completeName = roleArn.split(":").pop()
      let name = completeName?.split("/").pop()
      return name
   }
   async roleArnFromName() {
      let roleArn
      if (this.roleData == null) {
         roleArn = (await this.getRole()).Arn
      } else {
         roleArn = this.roleData.Arn
      }
      return roleArn
   }
   async getRoleArn() {
      if (this.roleArn == null) {
         this.roleArn = await this.roleArnFromName()
      }
      return this.roleArn
   }
   getRoleName() {
      if (this.roleName == null) {
         this.roleName = this.roleNameFromArn(this.roleArn || "")
      }
      return this.roleName || ""
   }
   async getRole() {
      if (this.roleData == null) {
         this.roleData = (await this.iamClient.getRole({RoleName: this.getRoleName()}).promise()).Role
      }
      return this.roleData
   }
}

interface PolicyInput {
   userPolicyName?: string
   awsPolicyName?: string
   policyArn?: string
}

class IAMPolicy extends IAMResource {
   policyName: string | undefined
   policyArn: string | undefined
   policyVersions: IAM.PolicyVersion[] | undefined
   policyDocument: AWSPolicyDocument | undefined
   policyInput: PolicyInput
   constructor(policyInput: PolicyInput, env?: Environment) {
      super(env)
      this.policyInput = policyInput
   }
   async setManagedPolicyFromGroup(group: IAMGroup) {
      let [ policy ] = await group.getGroupManagedPolicies()
      this.policyInput.policyArn = policy.Arn
      this.policyInput.userPolicyName = policy.PolicyName
   }
   getPolicyName(): string {      
      if (this.policyName == null) {
         const { awsPolicyName, userPolicyName, policyArn } = this.policyInput
         if (this.policyName == null) {
            if (awsPolicyName != null) {
               this.policyName = awsPolicyName
            }
            else if (userPolicyName != null) {
               this.policyName = userPolicyName
            }
            else if (policyArn != null) {
               const [ , name] = policyArn.split("/")
               this.policyName = name
            }
         }
      }
      return this.policyName || ""
   }
   async getPolicyArn(): Promise<string>{
      if (this.policyArn == null) {
         const { policyArn, awsPolicyName, userPolicyName  } = this.policyInput
         if (policyArn != null) {
            this.policyArn = policyArn
         } else {
            if (awsPolicyName != null) {
               this.policyArn = `arn:aws:iam::aws:policy/${awsPolicyName}`
            }
            else if (userPolicyName != null) {
               let accountId = await this.environment?.getAccountNumber()               
               this.policyArn = `arn:aws:iam::${accountId}:policy/${userPolicyName}`
            }
         }
      }
      return this.policyArn || ""
   }
   async getCurrentPolicyVersion(): Promise<IAM.PolicyVersion | undefined> {
      if (this.policyVersions == null) {
         await this.getPolicyVersions()
      }
      return this.policyVersions?.find(version => version.IsDefaultVersion)
   }
   async getPolicyVersions() {
      if (this.policyVersions == null) {         
         let policy = await this.getPolicyArn()         
         let versionsInfo = await this.iamClient.listPolicyVersions({
            PolicyArn: policy
         }).promise()
         this.policyVersions = versionsInfo.Versions
      }
      return this.policyVersions || ""
   }
   async getPolicyDocument(version?: string) {
      if (version === undefined) {
         version = (await this.getCurrentPolicyVersion())?.VersionId || ""
      }
      if (this.policyDocument == null) {
         let policy = await this.getPolicyArn()
         let versionInfo = await this.iamClient.getPolicyVersion({
            PolicyArn: policy,
            VersionId: version
         }).promise()
         this.policyDocument = JSON.parse(decodeURIComponent(versionInfo.PolicyVersion?.Document || ""))
      }
      return this.policyDocument
   }
}

class IAMUser extends IAMResource {
   userName: string
   constructor(userName: string, env?: Environment) {
      super(env)
      this.userName = userName
   }
}

export { IAMGroup, IAMPolicy, IAMResource, IAMUser, IAMRole }
export default { IAMGroup, IAMPolicy, IAMResource, IAMUser, IAMRole }
