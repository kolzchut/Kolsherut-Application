import {Feature} from "ol";
import {Geometry} from "ol/geom";
import labelComponent from "../label/label.ts";
import PoiData from "../../../../../types/poiData.ts";
import "./branchServicesPopup.css";
import {getHrefForCard} from "../../../../href.ts";
import {reRouteToCard} from "../../../../routes/reRoute.ts";
import mapAnalytics from "../../../../gtag/mapEvents.ts"

interface IProps {
    responses: never[];
    situations: never[];
    organization_name: string;
    service_name: string;
    branch_name: string;
    cardId: string;
}

let lengthOfFeatures = 0;

(window as any).handleMapFeatureClick = (event: Event, cardId: string) => {
    event.preventDefault();
    if (lengthOfFeatures === 1) {
        mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
    } else {
        mapAnalytics.enterServiceFromMapPopupMultiBranchEvent(cardId);
    }
    reRouteToCard({cardId: cardId});
};

const getHTMLForFeature = (props: IProps) => {
    const {service_name, organization_name, branch_name, cardId} = props;
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
    const href = getHrefForCard(cardId)

    return `
            <a class="feature-section" href="${href}" onclick="handleMapFeatureClick(event, '${cardId}')">
                <strong class="branch-title">${branch_name || organization_name || service_name}</strong>
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

    lengthOfFeatures = featuresProperties.length;

    const featuresHtml = featuresProperties.map(getHTMLForFeature).join('');
    const serviceName = featuresProperties[0]?.organization_name || '';
    return `
        <div class="branch-services-content">
            ${featuresHtml}
           <div class="branch-service-bottom-div">
                <strong>${serviceName}</strong>
           </div>
       </div>
    `;
};
export default branchServicesPopup;
