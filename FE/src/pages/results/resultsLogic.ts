import {IBranch} from "../../types/serviceType";
import {addPOI} from "../../services/map/poiInteraction";
import PoiData from "../../types/poiData";
import {setViewPort} from "../../services/map/view";

export const addResultsPOIs = (branches: IBranch[]) => {
    branches.forEach((branch: IBranch) => {
        if (!branch.geometry || !branch.responses || !branch.situations) return;
        const poiData: PoiData = {
            organization_name: branch.organizationName,
            service_name: branch.serviceName || "",
            branch_geometry: branch.geometry,
            responses: branch.responses,
            situations: branch.situations,
            cardId: branch.id,
            branch_address: branch.address,
            branch_name: branch.name,
            accurateLocation: branch.isAccurate
        }
        addPOI(poiData)
    });
}
export const setMapOnLocation = (bounds: [number, number, number, number]) => {
    const [minLon, minLat, maxLon, maxLat] = bounds;

    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;

    const lonSpan = maxLon - minLon;
    const latSpan = maxLat - minLat;

    const maxSpan = Math.max(lonSpan, latSpan);

    let zoom;
    if (maxSpan > 1) zoom = 6;
    else if (maxSpan > 0.5) zoom = 12;
    else if (maxSpan > 0.1) zoom = 13;
    else if (maxSpan > 0.05) zoom = 14;
    else if (maxSpan > 0.01) zoom = 15;
    else zoom = 16;
    setViewPort({
        center: [centerLon, centerLat],
        zoom: zoom
    });
}
