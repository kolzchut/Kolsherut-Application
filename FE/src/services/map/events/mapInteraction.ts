import {ObjectEvent} from "ol/Object";
import {Feature, MapBrowserEvent} from "ol";
import {Geometry} from "ol/geom";
import {MapSingleton} from "../map";
import onMapClick from "./onMapClick";
import {IMapInteractions, ViewInteractionEventTypes} from "../../../types/InteractionsTypes";
import logger from "../../logger/logger";
import {handler as hoverOnPOIHandler} from "./hoverOnPOI";
import {mapDragEvent} from "../../gtag/mapEvents";

const globals = {
    draggedBefore: false
}

const startDragEventIfNotHappenedBefore = (map: MapSingleton) => {
    if (globals.draggedBefore) return;
    globals.draggedBefore = true;
    mapDragEvent(map.view.getZoom() || -1)
}

export const mapInteractions: IMapInteractions = [
    {
        event: 'click',
        handler: (map: MapSingleton) => (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
            onMapClick(event, map.ol, (selectedFeature: Feature<Geometry>) => {
                logger.log({
                    message: "replace with Show only selected feature to display the selected feature (poi or route)",
                    payload: selectedFeature
                });
            });
        }
    },
    {
        event: "pointermove",
        handler: hoverOnPOIHandler
    },
    {
        event: "pointerdrag",
        handler: (map: MapSingleton) => () => {
            startDragEventIfNotHappenedBefore(map);
        }
    }
];

export const viewInteractions: Array<{
    event: ViewInteractionEventTypes,
    handler: (map: MapSingleton) => (event: ObjectEvent) => void
}> = [];
