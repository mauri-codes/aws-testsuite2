import { Environment, TestGroup, AWSEnvironment } from "../index";
import { TestSuite } from "..";
import { IAMGroup, IAMPolicy } from "../resources/IAM";
import { GroupHasConfig, PolicyHasConfig } from "../tests/IAM";

interface IAMGroupsParams {
   adminGroup: string
   financeUserGroup: string
   financeManagerGroup: string
}

class IAMGroups extends TestSuite {
   adminGroup: IAMGroup
   financeUsersGroup: IAMGroup
   financeManagersGroup: IAMGroup
   adminPolicy: IAMPolicy
   financeUserPolicy: IAMPolicy
   financeManagersPolicy: IAMPolicy
   constructor({adminGroup, financeManagerGroup, financeUserGroup}: IAMGroupsParams, env: Environment) {
      super()
      let environment = new AWSEnvironment(env)
      this.adminGroup = new IAMGroup(adminGroup, environment)
      this.financeUsersGroup = new IAMGroup(financeUserGroup, environment)
      this.financeManagersGroup = new IAMGroup(financeManagerGroup, environment)
      this.adminPolicy = new IAMPolicy({}, environment)
      this.financeUserPolicy = new IAMPolicy({}, environment)
      this.financeManagersPolicy = new IAMPolicy({}, environment)
   }
   async run() {
      await this.financeUserPolicy.setManagedPolicyFromGroup(this.financeUsersGroup)
      await this.financeManagersPolicy.setManagedPolicyFromGroup(this.financeManagersGroup)
      this.testGroups = [
         this.adminsGroupTests(),
         this.financeUsersGroupTests(),
         this.financeManagersGroupTests()
      ]
      return await super.run()
   }
   adminsGroupTests () {
      return new TestGroup("AdminGroupTests", [
         new GroupHasConfig(this.adminGroup, {
            userCount: 2,
            managedPolicies: ["AdministratorAccess"],
            managedPolicyCount: 1
         })
      ])
   }
   financeUsersGroupTests () {
      return new TestGroup("FinanceUsersGroupTests", [
         new GroupHasConfig(this.financeUsersGroup, {
            userCount: 1,
            managedPolicyCount: 1
         }),
         new PolicyHasConfig(this.financeUserPolicy, {
            policyDocument: {
               Statement: [
                  {
                     Resource: "*",
                     Effect: "Allow",
                     Action: [
                        "aws-portal:ViewPaymentMethods",
                        "aws-portal:ViewAccount",
                        "aws-portal:ViewBilling",
                        "aws-portal:ViewUsage"
                     ]
                  }
               ]
            }
         })
      ])
   }
   financeManagersGroupTests () {
      return new TestGroup("FinanceManagersGroupTests", [
         new GroupHasConfig(this.financeManagersGroup, {
            userCount: 1,
            managedPolicyCount: 1
         }),
         new PolicyHasConfig(this.financeManagersPolicy, {
            policyDocument: {
               Statement: [
                  {
                     Resource: "*",
                     Effect: "Allow",
                     Action: "aws-portal:*"
                  }
               ]
            }
         })
      ])
   }
}

export { IAMGroups }
