import vars from "../vars";

interface IProps {
    cards: { id: string, last_modified: string }[],
    responses: { id: string, name: string }[],
    situations: { id: string, name: string }[]
}

const transformSiteMapFromJSONToText = (sitemap: IProps): string => {
    const {cards, responses, situations} = sitemap;

    const urls = [`${vars.serverSetups.origin}/?p=home`];
    const cardUrls = cards.map(card => `${vars.serverSetups.origin}/?p=card&c=${card.id}`);
    const responseUrls = responses.map(response => `${vars.serverSetups.origin}/?p=results&sq=${response.name || response.id}&rf=["${response.id}"]`);
    const situationsUrls = situations.map(situation => `${vars.serverSetups.origin}/?p=results&sq=${situation.name || situation.id}&sf=["${situation.id}"]`);

    return [...urls, ...cardUrls, ...responseUrls, ...situationsUrls].join('\r\n')
};
export default transformSiteMapFromJSONToText;
