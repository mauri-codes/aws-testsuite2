import { AWSResource, Environment } from "../index"
import { CloudFront } from "aws-sdk";
interface CloudFrontDistributionProps {
   id?: string
   tag?: CloudFront.Tag
}
class CloudFrontDistribution extends AWSResource  {
   cfClient: CloudFront
   distributionSummary: CloudFront.DistributionSummary | undefined
   id: string | undefined
   constructor(props: CloudFrontDistributionProps, env?: Environment) {
      super("CloudFront", env)
      this.cfClient = this.client as CloudFront
      if (props.id) {
         this.id = props.id
      }
   }
   async getDistributionIDFromTag(tag: CloudFront.Tag) {
      const distributionsInfo = await this.cfClient.listDistributions({}).promise()
      let distributionsList = distributionsInfo.DistributionList?.Items
      if (!distributionsList) {
         throw "_NoDistributionList"
      }
      if (distributionsList.length > 10) {
         throw "_TooManyDistributions"
      }
      const distributionTagsPromises = distributionsList.map(distribution => {
         return this.cfClient.listTagsForResource({Resource: distribution.ARN}).promise()
      })
      const distributionTags = await Promise.all(distributionTagsPromises)
      const taggedDistributtions = distributionsList.flatMap((distribution, index) => {
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
      if (taggedDistributtions.length == 0) {
         throw "_NoTaggedDistribution"
      } else if (taggedDistributtions.length > 1) {
         throw "_OnlyOneTaggedDistributtionAllowed"
      }
      this.distributionSummary = taggedDistributtions.pop()
   }
}

export { CloudFrontDistribution }
export default { CloudFrontDistribution }