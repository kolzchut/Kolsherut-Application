import vars from "../vars";

interface IProps {
    responses: { query: string, slug: string }[],
    situations: { query: string, slug: string }[]
}

const extractSubSlug = (slug: string): string => slug.split(':').slice(-1)[0];

const transformSiteMapToListOfResponseAndSituationLinks = ({responses, situations}: IProps) => {

    const responseUrls = responses.map(response => ({
        name: response.query || response.slug,
        link: `${vars.serverSetups.origin}/${encodeURI(extractSubSlug(response.slug))}`
    }));

    const situationsUrls = situations.map(situation => ({
        name: situation.query || situation.slug,
        link: `${vars.serverSetups.origin}/${encodeURI(extractSubSlug(situation.slug))}`
    }));

    return {
        responseUrls,
        situationsUrls
    }
};
export default transformSiteMapToListOfResponseAndSituationLinks;
