import getTaxonomy from "./getTaxonomy";
import breakdownTaxonomy from "./breakdownTaxonomy";

const getProcessedTaxonomies =async()=>{
    const {responses, situations} = await getTaxonomy();
    const fixedResponses = breakdownTaxonomy(responses.items);
    const fixedSituations = breakdownTaxonomy(situations.items);
    return {situations:fixedSituations, responses:fixedResponses};
}
export default getProcessedTaxonomies;
