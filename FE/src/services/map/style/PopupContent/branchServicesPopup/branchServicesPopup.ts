import {Feature} from "ol";
import {Geometry} from "ol/geom";
import labelComponent from "../label/label.ts";
import PoiData from "../../../../../types/poiData.ts";
import "./branchServicesPopup.css";
import {getHrefForCard} from "../../../../href.ts";
import {getCommonFooterText, groupByOrganization} from "./branchServicesPopupLogic.ts";
import "../../../utils/handleMapFeatureClick.ts";

const getHTMLForFeature = (props: PoiData, lengthOfFeatures: number) => {
    const {service_name, organization_name, branch_name, cardId, service_description} = props;
    const responses = props.responses || [];
    const situations = props.situations || [];
    const firstResponse = responses[0];
    const responseExtra = responses.length > 1 ? responses.length - 1 : 0;
    const firstSituation = situations[0];
    const situationExtra = situations.length > 1 ? situations.length - 1 : 0;
    const responseLabel = firstResponse ?
        labelComponent({response: firstResponse, extra: responseExtra, accessibilityActive: false}) : '';
    const situationLabel = firstSituation ?
        labelComponent({situation: firstSituation, extra: situationExtra, accessibilityActive: false}) : '';
    const href = getHrefForCard(cardId);
    const safeCardId = String(cardId).replace(/'/g, "\\'");

    return `
            <a class="feature-section" href="${href}" onclick="handleMapFeatureClick(event, '${safeCardId}', ${lengthOfFeatures})">
                <strong class="branch-title">${service_name || service_description || branch_name || organization_name}</strong>
                <div class="feature-labels">
                    ${responseLabel}
                    ${situationLabel}
                </div>
            </a>
        `;
}


const branchServicesPopup = ({feature, root}: { feature: Feature<Geometry>, root: HTMLDivElement }): string => {
    if (!feature || !root) return '';
    root.className = "branch-services-popup-div";
    const featuresProperties = feature.getProperties().features.map((f: Feature<Geometry>) => f.getProperties() as PoiData);

    const lengthOfFeatures = featuresProperties.length;

    const groups = groupByOrganization(featuresProperties);
    const parts: string[] = [];
    groups.forEach((items, orgName) => {
        parts.push(`
            <div class="branch-service-bottom-div">
                <strong>${orgName}</strong>
            </div>
        `);
        parts.push(items.map((item: PoiData) => getHTMLForFeature(item, lengthOfFeatures)).join(''));
    });
    const featuresHtml = parts.join('');

    const footerText = getCommonFooterText(featuresProperties);
    const footerHtml = footerText ? `
           <div class="branch-service-bottom-div">
                <strong>${footerText}</strong>
           </div>
    ` : '';

    return `
        <div class="branch-services-content">
            ${featuresHtml}
           ${footerHtml}
       </div>
    `;
};
export default branchServicesPopup;
