import vars from "../vars";
import encodeForURL from "./encodeForURL";

interface IProps {
    responses: { query: string, slug: string }[],
    situations: { query: string, slug: string }[]
}

const transformSiteMapToListOfResponseAndSituationLinks = ({responses,situations}: IProps) => {

    const responseUrls = responses.map(response =>({
        name: response.query || response.slug,
        link:`${vars.serverSetups.origin}/p/results/sq/${encodeForURL(response.query || response.slug)}/brf/${encodeForURL(response.slug)}`
    }));

    const situationsUrls = situations.map(situation => ({
        name: situation.query || situation.slug,
        link:`${vars.serverSetups.origin}/p/results/sq/${encodeForURL(situation.query || situation.slug)}/bsf/${encodeForURL(situation.slug)}`
    }));

    return {
        responseUrls,
        situationsUrls
    }
};
export default transformSiteMapToListOfResponseAndSituationLinks;
