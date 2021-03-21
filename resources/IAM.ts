import { AWSResource, Environment } from "../index"
import { IAM, Request } from "aws-sdk";
import { CatchError, CatchTestError } from "../util/errors";

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

class IAMPolicy extends IAMResource {
   policyName: string
   policyArn: string
   constructor(policyName: string, env?: Environment) {
      super(env)
      this.policyName = policyName
      this.policyArn = ``
   }
}

class IAMUser extends IAMResource {
   userName: string
   constructor(userName: string, env?: Environment) {
      super(env)
      this.userName = userName
   }
}

export { IAMGroup, IAMPolicy, IAMResource, IAMUser }
export default { IAMGroup, IAMPolicy, IAMResource, IAMUser }
