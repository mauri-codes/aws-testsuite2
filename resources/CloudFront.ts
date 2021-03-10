import { AWSResource, Environment, TestResult } from "../index"
import { CloudFront } from "aws-sdk";
interface CloudFrontDistributionProps {
   id?: string
   tag?: CloudFront.Tag
}
class CloudFrontDistribution extends AWSResource  {
   cfClient: CloudFront
   distributionData: CloudFront.Distribution | undefined
   distributionSummary: CloudFront.DistributionSummary | undefined
   id: string | undefined
   tag: CloudFront.Tag | undefined
   constructor(props: CloudFrontDistributionProps, env?: Environment) {
      super("CloudFront", env)
      this.cfClient = this.client as CloudFront
      this.tag = props.tag
      if (props.id) {
         this.id = props.id
      }
   }
   async getDistributionDataFromTag(tag: CloudFront.Tag) {
      const result: TestResult = {
         success: false
      }
      try {
         const distributionsInfo = await this.cfClient.listDistributions({}).promise()
         let distributionsList = distributionsInfo.DistributionList?.Items
         if (!distributionsList) {
            result.message = "No distribution configuration found"
            throw "_NoDistributionList"
         }
         if (distributionsList.length > 10) {
            result.message = "You have more than 10 distributions in your account"
            throw "_TooManyDistributions"
         }
         const distributionTagsPromises = distributionsList.map(distribution => {
            return this.cfClient.listTagsForResource({Resource: distribution.ARN}).promise()
         })
         const distributionTags = await Promise.all(distributionTagsPromises)
         const taggedDistributtions = this.getTaggedDistributions(distributionsList, distributionTags, tag)
         if (taggedDistributtions.length == 0) {
            result.message = `No distribution found with tag [${tag.Key}, ${tag.Value}]`
            throw "_NoTaggedDistribution"
         } else if (taggedDistributtions.length > 1) {
            result.message = `You have more than one distribution tagged with tag [${tag.Key}, ${tag.Value}]`
            throw "_OnlyOneTaggedDistributtionAllowed"
         }
         this.distributionSummary = taggedDistributtions.pop()
         result.success = true
      }
      catch(err) {
         result.error = err.code
      }
      return result
   }
   async processDistributionData(
      distributionDataFunc: (distribution: CloudFront.Distribution) => TestResult,
      distributionSummaryFunc: (distribution: CloudFront.DistributionSummary) => TestResult
   ) {
      const result: TestResult = {
         success: false
      }
      let distributionRequest = await this.getDistributionData()
      if (distributionRequest.error) {
         return distributionRequest
      }
      if (this.distributionData) {
         let distributionData:  CloudFront.Distribution = this.distributionData
         return distributionDataFunc(distributionData)
      } else if(this.distributionSummary) {
         let distributionSummary: CloudFront.DistributionSummary = this.distributionSummary
         return distributionSummaryFunc(distributionSummary)
      }
      result.message = "No Distribution Found"
      return result
   }
   async getDistributionDataFromId(Id: string) {
      const result: TestResult = {
         success: false
      }
      try {
         const distributionsInfo = await this.cfClient.getDistribution({Id}).promise()
         this.distributionData = distributionsInfo.Distribution
         result.success = true
      } catch (err) {
         result.error = err.code
      }
      return result
   }
   async getDistributionData() {
      let result: TestResult = {
         success: true
      }
      if (this.distributionData) {
         return result
      } else if (this.distributionSummary) {
         return result
      } else if (this.id) {
         let distInfo = await this.getDistributionDataFromId(this.id)
         if (distInfo.error) {
            return distInfo
         }
      } else if (this.tag) {
         let distInfo = await this.getDistributionDataFromTag(this.tag)
         if (distInfo.error) {
            return distInfo
         }
      }
      return result
   }
   getTaggedDistributions(
      distributionsList: CloudFront.DistributionSummaryList,
      distributionTags: CloudFront.ListTagsForResourceResult[],
      tag: CloudFront.Tag) {
      return distributionsList.flatMap((distribution, index) => {
         const Tags = distributionTags[index].Tags.Items
         let hasTags = Tags?.some(distributionTag => {
            if (distributionTag.Key == tag.Key && distributionTag.Value == tag.Value) {
               return true
            }
            return false
         })
         if (hasTags) {
            return [distribution]
         }
         return []
      })
   }
}

export { CloudFrontDistribution }
export default { CloudFrontDistribution }