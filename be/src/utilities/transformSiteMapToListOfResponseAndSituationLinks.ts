import vars from "../vars";

interface IProps {
    responses: { query: string, slug: string }[],
    situations: { query: string, slug: string }[]
}

const transformSiteMapToListOfResponseAndSituationLinks = ({responses,situations}: IProps) => {

    const responseUrls = responses.map(response =>({
        name: response.query || response.slug,
        link:`${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(response.query || response.slug)}&brf=${encodeURIComponent(response.slug)}`
    }));

    const situationsUrls = situations.map(situation => ({
        name: situation.query || situation.slug,
        link:`${vars.serverSetups.origin}/?p=results&sq=${encodeURIComponent(situation.query || situation.slug)}&bsf=${encodeURIComponent(situation.slug)}`
    }));

    return {
        responseUrls,
        situationsUrls
    }
};
export default transformSiteMapToListOfResponseAndSituationLinks;
