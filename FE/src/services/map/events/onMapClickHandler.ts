import {Feature} from "ol";
import {Geometry} from "ol/geom";
import logger from "../../logger/logger.ts";
import mapAnalytics from "../../gtag/mapEvents.ts";

const onMapClickHandler = (selectedFeature: Feature<Geometry>) => {
    const featureProperties = selectedFeature.getProperties();
    mapAnalytics.onMapBranchClicked({cardId:featureProperties.cardId, branchName: featureProperties.name || 'סניף ללא שם'});
    logger.log({
        message: "replace with Show only selected feature to display the selected feature (poi or route)",
        payload: featureProperties
    });
}
export default onMapClickHandler
