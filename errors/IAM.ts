import { ErrorDescriptor } from "../util/errors";


let IncorrectUserCountForGroup: (group: string, count: number, countFound: number) => ErrorDescriptor =
(group, count, countFound) => ({
   code: IncorrectUserCountForGroup.name,
   message: `Expected ${group} to have user count of ${count}. Found ${countFound}.`
})

let IncorrectManagedPolicyCountForGroup: (group: string, count: number, countFound: number) => ErrorDescriptor =
(group, count, countFound) => ({
   code: IncorrectManagedPolicyCountForGroup.name,
   message: `Expected ${group} to have managed policy count of ${count}. Found ${countFound}.`
})

let PolicyForGroupNotFound: (group: string, policy: string) => ErrorDescriptor =
(group, policy) => ({
   code: PolicyForGroupNotFound.name,
   message: `Policy ${policy} not attached to group ${group}.`
})

let PolicyStatementNotFound: (policy: string, Sid: string) => ErrorDescriptor =
(policy, Sid) => ({
   code: PolicyStatementNotFound.name,
   message: `Policy statement ${Sid} not found for ${policy}.`
})

let IncorrectPolicyStatementCount: (policy: string, count: number, countFound: number) => ErrorDescriptor =
(policy, count, countFound) => ({
   code: IncorrectPolicyStatementCount.name,
   message: `Policy document for ${policy} should have ${count} Statements. ${countFound} found.`
})

export {
   PolicyStatementNotFound,
   PolicyForGroupNotFound,
   IncorrectUserCountForGroup,
   IncorrectPolicyStatementCount,
   IncorrectManagedPolicyCountForGroup
}