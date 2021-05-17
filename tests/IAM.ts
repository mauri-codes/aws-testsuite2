import {
   PolicyForGroupNotFound,
   IncorrectUserCountForGroup,
   IncorrectManagedPolicyCountForGroup,
   IncorrectPolicyStatementCount,
   PolicyStatementNotFound,
   IncorrectManagedPolicesCount
} from "../errors/IAM"
import { TestResult, Test, SuccessFulTest } from "../index"
import { CatchTestError, ErrorDescriptor, TestError } from "../util/errors"
import { IAMUser, IAMGroup, IAMPolicy, IAMRole } from "../resources/IAM"
import { AWSPolicyDocument, PolicyStatement, PolicyTestConfig, RoleTestConfig } from "../types/IAM.types"

interface GroupTestConfig {
   userCount?: number
   managedPolicyCount?: number,
   managedPolicies?: string[]
}

class GroupHasConfig implements Test {
   id: string = GroupHasConfig.name
   group: IAMGroup
   groupConfig: GroupTestConfig
   constructor(id: string, group: IAMGroup, groupConfig: GroupTestConfig) {
      if (id) {
         this.id = id
      }
      this.group = group
      this.groupConfig = groupConfig
   }
   @CatchTestError(GroupHasConfig.name)
   async run(): Promise<TestResult> {
      await this.hasUserCountTest()
      await this.hasManagedPolicyCountTest()
      await this.hasManagedPoliciesTest()
      return SuccessFulTest(this.id)
   }

   async hasUserCountTest() {
      if( this.groupConfig.userCount) {
         let groupData = await this.group.getGroup()
         let countFound = groupData.length
         let count = this.groupConfig.userCount
         if (count != countFound) {
            throw new TestError(IncorrectUserCountForGroup(this.group.groupName, count, countFound))
         }
      }
   }

   async hasManagedPolicyCountTest() {
      if (this.groupConfig.managedPolicyCount) {
         let groupPolicies = await this.group.getGroupManagedPolicies()
         let count = this.groupConfig.managedPolicyCount
         let countFound = groupPolicies.length
         if (count != countFound) {
            throw new TestError(IncorrectManagedPolicyCountForGroup(this.group.groupName, count, countFound))
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
                  throw new TestError(PolicyForGroupNotFound(this.group.groupName, policy))
               }
            }
         )
      }
   }
}

class PolicyHasConfig implements Test{
   id: string = PolicyHasConfig.name
   policyConfig: PolicyTestConfig
   policy: IAMPolicy
   constructor(id:string, policy: IAMPolicy, policyConfig: PolicyTestConfig) {
      this.id = id
      this.policy = policy
      this.policyConfig = policyConfig
   }

   @CatchTestError(PolicyHasConfig.name)
   async run() {
      await this.hasPolicyDocumentTest()
      return SuccessFulTest(this.id)
   }
   async hasPolicyDocumentTest() {
      let document = await this.policy.getPolicyDocument()
      if (document != undefined && this.policyConfig.policyDocument) {
         let policyDocument:AWSPolicyDocument = document
         let configPolicyStatements = this.policyConfig.policyDocument.Statement
         let configCount = configPolicyStatements.length
         let countFound = policyDocument.Statement.length
         if (configCount !== countFound) {
            throw new TestError(IncorrectPolicyStatementCount(this.policy.policyName || "", configCount, countFound))
         }
         configPolicyStatements.forEach(statement => {
            let statementFound = policyDocument.Statement.find(docStatement => this.sameStatements(statement, docStatement))
            if (statementFound == null) {
               throw new TestError(PolicyStatementNotFound(this.policy.policyName || "", statement.Sid || ""))
            }
         })
      }
   }
   sameStatements(statementA: PolicyStatement, statementB: PolicyStatement) {
      if (typeof statementA.Action !== typeof statementB.Action) {
         return false
      }
      if (typeof statementA.Resource !== typeof statementB.Resource) {
         return false
      }
      let effect = statementA.Effect === statementB.Effect

      let action: boolean
      if (typeof statementA.Action === 'string' || typeof statementB.Action === 'string') {
         action = statementA.Action === statementB.Action
      } else {
         action = sameArrays(statementA.Action, statementB.Action)
      }

      let resource: boolean
      if (typeof statementA.Resource === 'string' || typeof statementB.Resource === 'string') {
         resource = statementA.Resource === statementB.Resource
      } else {
         resource = sameArrays(statementA.Resource, statementB.Resource)
      }
      return effect && action && resource

      function sameArrays(array1: string[], array2: string[]) {
         if (array1.length !== array2.length) {
            return false
         }
         return array1.every(action => array2.includes(action))
      }
   }
}

class RoleHasConfig implements Test{
   id: string = RoleHasConfig.name
   roleConfig: RoleTestConfig
   role: IAMRole
   error: ErrorDescriptor | undefined
   constructor(id:string, role: IAMRole, roleConfig: RoleTestConfig, error?: ErrorDescriptor) {
      this.error = error
      this.id = id
      this.role = role
      this.roleConfig = roleConfig
   }

   @CatchTestError(RoleHasConfig.name)
   async run() {
      await this.hasRoleConfig()
      return SuccessFulTest(this.id)
   }
   async hasRoleConfig() {
      let attachedPolicies = await this.role.getAttachedRolePolicies()
      let countFound = attachedPolicies?.length
      let countReq = this.roleConfig.attachedPoliciesCount
      if( countReq != null && countFound !== countReq) {
         throw new TestError(IncorrectManagedPolicesCount({role: this.role.roleName, count: countReq, countFound}))
      }
   }

}

export { GroupHasConfig, PolicyHasConfig, RoleHasConfig }