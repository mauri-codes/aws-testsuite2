import { AWSResource, Environment } from "../index"
import { CloudFront } from "aws-sdk";
import { NoDistributionListError, NoTaggedDistributionError, OnlyOneTaggedDistributtionAllowedError, TooManyDistributionsError } from "../errors/CloudFront";
interface CloudFrontDistributionProps {
   id?: string
   tag?: CloudFront.Tag
}
class CloudFrontDistribution extends AWSResource  {
   cfClient: CloudFront
   distributionData: CloudFront.Distribution | undefined
   distributionSummary: CloudFront.DistributionSummary | undefined
   viewerCertificate: CloudFront.ViewerCertificate | undefined
   id: string | undefined
   tag: CloudFront.Tag | undefined
   origins: CloudFront.Origins | undefined
   constructor(props: CloudFrontDistributionProps, env?: Environment) {
      super("CloudFront", env)      
      this.cfClient = this.client as CloudFront
      this.tag = props.tag
      if (props.id) {
         this.id = props.id
      }
   }
   async getViewerCertificate(): Promise<CloudFront.ViewerCertificate | undefined> {
      if (this.viewerCertificate == null) {
         if (this.id) {
            let distributionData = await this.getDistributionDataFromId()
            this.viewerCertificate = distributionData?.DistributionConfig.ViewerCertificate
         } else if (this.tag) {
            let distributionSummary = await this.getDistributionDataFromTag()
            this.viewerCertificate = distributionSummary?.ViewerCertificate
         }
      }
      return this.viewerCertificate
   }
   async getOrigins(): Promise<CloudFront.Origins | undefined> {      
      if (this.origins == null) {
         if (this.id) {
            let distributionData = await this.getDistributionDataFromId()
            this.origins = distributionData?.DistributionConfig.Origins
         } else if (this.tag) {
            let distributionSummary = await this.getDistributionDataFromTag()            
            this.origins = distributionSummary?.Origins
         }
      }
      return this.origins
   }
   async listDistributions(): Promise<CloudFront.DistributionSummary[]> {
      const distributionsInfo = await this.cfClient.listDistributions({}).promise()
      let distributionsList = distributionsInfo.DistributionList?.Items
      if (!distributionsList) {
         throw new Error(NoDistributionListError)
      }
      if (distributionsList.length > 30) {
         throw new Error(TooManyDistributionsError)
      }
      return distributionsList
   }
   async tagsFromDistributions(distributionsList: CloudFront.DistributionSummary[]) {
      const distributionTagsPromises = distributionsList.map(distribution => {
         return this.cfClient.listTagsForResource({Resource: distribution.ARN}).promise()
      })
      return await Promise.all(distributionTagsPromises)
   }
   async getDistributionDataFromTag(): Promise<CloudFront.DistributionSummary | undefined> {
      if (this.distributionSummary == null) {
         let distributionsList = await this.listDistributions()
         const distributionTags = await this.tagsFromDistributions(distributionsList)
         const taggedDistributtions = this.getTaggedDistributions(distributionsList, distributionTags, this.tag|| {Key: ""})
         if (taggedDistributtions.length == 0) {
            throw new Error(NoTaggedDistributionError)
         } else if (taggedDistributtions.length > 1) {
            throw new Error(OnlyOneTaggedDistributtionAllowedError)
         }
         this.distributionSummary = taggedDistributtions.pop()
      }
      return this.distributionSummary
   }
   async getDistributionDataFromId(): Promise<CloudFront.Distribution | undefined> {
      if (this.distributionData == null) {
         const distributionsInfo = await this.cfClient.getDistribution({Id: this.id || ""}).promise()
         this.distributionData = distributionsInfo.Distribution
      }
      return this.distributionData
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