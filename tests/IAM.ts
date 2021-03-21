import {
   PolicyForGroupNotFound,
   IncorrectUserCountForGroup,
   IncorrectManagedPolicyCountForGroup
} from "../errors/IAM"
import { TestResult, Test, SuccessFulTest } from "../index"
import { IAMUser, IAMGroup, IAMPolicy } from "../resources/IAM"
import { CatchTestError, TestError } from "../util/errors"

interface GroupTestConfig {
   userCount?: number
   awsPolicy?: string[]
   managedPolicyCount?: number,
   managedPolicies?: string[]
}

class GroupHasConfig implements Test {
   group: IAMGroup
   groupName: string
   groupConfig: GroupTestConfig
   constructor(group: IAMGroup, groupConfig: GroupTestConfig) {
      this.group = group
      this.groupConfig = groupConfig
      this.groupName = group.groupName
   }
   @CatchTestError()
   async run(): Promise<TestResult> {
      await this.hasUserCountTest()
      await this.hasManagedPolicyCountTest()
      await this.hasManagedPoliciesTest()
      return SuccessFulTest
   }

   async hasUserCountTest() {
      if( this.groupConfig.userCount) {
         let groupData = await this.group.getGroup()
         let countFound = groupData.length
         let count = this.groupConfig.userCount
         if (count != countFound) {
            throw new TestError(IncorrectUserCountForGroup(this.groupName, count, countFound))
         }
      }
   }

   async hasManagedPolicyCountTest() {
      if (this.groupConfig.managedPolicyCount) {
         let groupPolicies = await this.group.getGroupManagedPolicies()
         let count = this.groupConfig.managedPolicyCount
         let countFound = groupPolicies.length
         if (count != countFound) {
            throw new TestError(IncorrectManagedPolicyCountForGroup(this.groupName, count, countFound))
         }
      }
   }

   async hasManagedPoliciesTest() {
      if (this.groupConfig.managedPolicies) {
         let groupPolicies = await this.group.getGroupManagedPolicies()
         this.groupConfig.managedPolicies.forEach(
            policy => {
               let policyFound = groupPolicies.some(groupPolicy => groupPolicy.PolicyName === policy)
               if (!policyFound) {
                  throw new TestError(PolicyForGroupNotFound(this.groupName, policy))
               }
            }
         )
      }
   }
}

class PolicyHasConfig implements Test{

   async run() {
      return SuccessFulTest
   }
}

export { GroupHasConfig }