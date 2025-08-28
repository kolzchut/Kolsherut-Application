import {Feature} from "ol";
import {Geometry} from "ol/geom";
import PoiData from "../../../../../types/poiData.ts";
import {Situation, Response} from "../../../../../types/cardType.ts";
import labelComponent from "../label/label.ts";
import "./singleServicePopup.css";
import "../../../utils/handleMapFeatureClick.ts";
import {getHrefForCard} from "../../../../href.ts";


const getLabels = ({responses, situations}: { responses: Response[], situations: Situation[] }): string => {
    const firstResponse = responses[0];
    const responseExtra = responses.length > 1 ? responses.length - 1 : 0;
    const firstSituation = situations[0];
    const situationExtra = situations.length > 1 ? situations.length - 1 : 0;
    const responseLabel = firstResponse ?
        labelComponent({response: firstResponse, extra: responseExtra, accessibilityActive: false}) : '';
    const situationLabel = firstSituation ?
        labelComponent({situation: firstSituation, extra: situationExtra, accessibilityActive: false}) : '';

    return `
        <div class="feature-labels">
            ${responseLabel}
            ${situationLabel}
        </div>
        `
}


const singleServicePopup = ({feature, root}: { feature: Feature<Geometry>, root: HTMLDivElement }): string =>{
    if (!feature || !root) return '';
    root.className = "branch-services-popup-div";
    const featuresProperties = feature.getProperties().features.map((f: Feature<Geometry>) => f.getProperties());
    const featureData = featuresProperties[0] as PoiData;
    const labels = getLabels({responses: featureData.responses || [], situations: featureData.situations || []});
    const operatingUnitOrOrganizationName = featureData.branch_operating_unit || featureData.organization_name;
    const branchAddress = featureData.address_parts
    const cardId = featureData.cardId
    const href = getHrefForCard(cardId)
    return `
     <a class="single-service-popup-feature-section" href="${href}" onclick="handleMapFeatureClick(event, '${cardId}', 1)">
    <div class="single-service-popup">
    <div class="single-service-popup-main">
    <span class="single-service-popup-title">${featureData.service_name || featureData.service_description || featureData.branch_name || featureData.organization_name}</span>
    ${labels}
    </div>
    <div class="single-service-popup-sub">
        <span class="single-service-popup-operating-unit-or-organization-name">${operatingUnitOrOrganizationName}</span>
        <div>        
            <span class="single-service-popup-address-bold">${branchAddress.primary ? branchAddress.primary+ " - " : ''}</span>
            <span class="single-service-popup-address-normal"> ${branchAddress.secondary|| ''}</span>
        </div>

    </div>
    `

}

export default singleServicePopup;
