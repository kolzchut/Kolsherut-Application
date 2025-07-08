import {MapSingleton} from "../map";
import {MapBrowserEvent} from "ol";
import {Feature} from "ol";
import logger from "../../logger/logger";

export const handler = (_map: MapSingleton) => (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
    if (!(event.originalEvent instanceof PointerEvent)) {
        logger.warning({message:"Event is not a PointerEvent"});
        return;
    }

    const map = _map.ol;
    const poiLayer = map.getLayers().item(1);

    if (!poiLayer) {
        logger.warning({message:"POI layer not found at index 1"});
        return;
    }

    const features = map.getFeaturesAtPixel(event.pixel, {
        layerFilter: (layer) => layer === poiLayer,
    });
    if (features && features.length > 0) {
        const feature = features[0] as Feature;
        logger.log({message:`POI hovered: ${feature.get('name') || 'Unnamed POI'}`
    });

    } else {
        console.log("No POI hovered");
    }
};
