import { ErrorDescriptor } from "../util/errors";


let IncorrectUserCountForGroup: (group: string, count: number, countFound: number) => ErrorDescriptor =
(group, count, countFound) => ({
   code: "IncorrectUserCountForGroup",
   message: `Expected ${group} to have user count of ${count}. Found ${countFound}.`
})

let IncorrectManagedPolicyCountForGroup: (group: string, count: number, countFound: number) => ErrorDescriptor =
(group, count, countFound) => ({
   code: "IncorrectManagedPolicyCountForGroup",
   message: `Expected ${group} to have managed policy count of ${count}. Found ${countFound}.`
})

let PolicyForGroupNotFound: (group: string, policy: string) => ErrorDescriptor =
(group, policy) => ({
   code: "PolicyForGroupNotFound",
   message: `Policy ${policy} not attached to group ${group}.`
})

export {
    PolicyForGroupNotFound,
    IncorrectUserCountForGroup,
    IncorrectManagedPolicyCountForGroup
}