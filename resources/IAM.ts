import { AWSResource, Environment } from "../index"
import { IAM, Request } from "aws-sdk";

class IAMResource extends AWSResource {
   iamClient: IAM
   constructor(env?: Environment) {
      super("IAM", env)
      this.iamClient = this.client as IAM
   }
}

class IAMGroup extends IAMResource {
   groupName: string
   getGroupData: IAM.GetGroupResponse | undefined
   constructor(groupName: string, env?: Environment) {
      super(env)
      this.groupName = groupName
   }
   async getGroup(): Promise<IAM.GetGroupResponse> {
      if (this.getGroupData != null) {
         return this.getGroupData
      }
      this.getGroupData = await this.iamClient.getGroup({
         GroupName: this.groupName
      }).promise()
      return this.getGroupData
   }
}

class IAMPolicy extends IAMResource {
   policyName: string
   constructor(policyName: string, env?: Environment) {
      super(env)
      this.policyName = policyName
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
