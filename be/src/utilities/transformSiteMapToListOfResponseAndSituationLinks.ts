import vars from "../vars";

interface IProps {
    cardIds: string[],
    responses: { id: string, name: string }[],
    situations: { id: string, name: string }[]
}

const transformSiteMapToListOfResponseAndSituationLinks = (sitemap: IProps) => {
    const {responses, situations} = sitemap;
    
    const responseUrls = responses.map(response =>({
        name: response.name || response.id,
        link:`${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(response.name || response.id)}&rf=["${encodeURIComponent(response.id)}"]`
    }));

    const situationsUrls = situations.map(situation => ({
        name: situation.name || situation.id,
        link:`${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(situation.name || situation.id)}&sf=["${encodeURIComponent(situation.id)}"]`
    }));

    return {
        responseUrls,
        situationsUrls
    }
};
export default transformSiteMapToListOfResponseAndSituationLinks;
