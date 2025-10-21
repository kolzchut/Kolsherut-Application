import vars from "../vars";

interface IProps {
    responses: { query: string, slug: string }[],
    situations: { query: string, slug: string }[]
}

const transformSiteMapToListOfResponseAndSituationLinks = ({responses,situations}: IProps) => {

    const responseUrls = responses.map(response =>({
        name: response.query || response.slug,
        link:`${vars.serverSetups.origin}/p/results/sq/${encodeURI(response.query || response.slug)}/brf/${encodeURI(response.slug)}`
    }));

    const situationsUrls = situations.map(situation => ({
        name: situation.query || situation.slug,
        link:`${vars.serverSetups.origin}/p/results/sq/${encodeURI(situation.query || situation.slug)}/bsf/${encodeURI(situation.slug)}`
    }));

    return {
        responseUrls,
        situationsUrls
    }
};
export default transformSiteMapToListOfResponseAndSituationLinks;
