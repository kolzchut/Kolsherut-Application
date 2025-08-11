import {Feature} from "ol";
import {Geometry} from "ol/geom";
import PoiData from "../../../../../types/poiData.ts";
import "./branchSummaryPopup.css";
import {reRouteToCard} from "../../../../routes/reRoute.ts";
import mapAnalytics from "../../../../gtag/mapEvents.ts"
import {replaceMacros} from "../../../../str.ts";


let lengthOfFeatures = 0;

(window as unknown as Record<string, unknown>).handleMapFeatureSummaryClick = (event: Event, cardId: string) => {
    event.preventDefault();
    if (lengthOfFeatures === 1) {
        mapAnalytics.enterServiceFromMapPopupSingleBranchEvent(cardId);
    } else {
        mapAnalytics.enterServiceFromMapPopupMultiBranchEvent(cardId);
    }
    reRouteToCard({cardId: cardId});
};

const branchSummaryPopup = ({feature, root}: { feature: Feature<Geometry>, root: HTMLDivElement }): string => {
    if (!feature || !root) return '';
    root.className = "summary-popup-container";
    const featuresProperties = feature.getProperties().features.map((f: Feature<Geometry>) => f.getProperties() as PoiData);

    lengthOfFeatures = featuresProperties.length;
    const identifier = featuresProperties[0]?.organization_name || featuresProperties[0]?.service_name || featuresProperties[0]?.branch_name || '';
    const totalBranches = featuresProperties.length;
    const sumOfOrganizations = featuresProperties.map((f: PoiData) => f.organization_name);
    const uniqueOrganizationsCount = new Set(sumOfOrganizations).size;
    const title = replaceMacros({
        stringWithMacros: window.strings.smallPopUp.title,
        macrosAndReplacements: {"%%NUM_OF_BRANCHES%%": totalBranches}
    });
    const subtitleIfAdditionalOrganizations = replaceMacros({
        stringWithMacros: window.strings.smallPopUp.subtitle,
        macrosAndReplacements: {
            "%%ORGANIZATION_NAME%%": identifier,
            "%%NUM_OF_ADDITIONAL_ORGANIZATIONS%%": (uniqueOrganizationsCount - 1).toString()
        }
    });
    const subtitle = uniqueOrganizationsCount > 1 ? subtitleIfAdditionalOrganizations : identifier;
    return `
        <div class="summary-popup-content">
            <div class="summary-branches-count-header">
                <span>${title}</span>
            </div>
           <div class="summary-popup-footer">
                <strong>${subtitle}</strong>
           </div>
       </div>
    `;
};

export default branchSummaryPopup;
