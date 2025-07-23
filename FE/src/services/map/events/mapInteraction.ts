import {ObjectEvent} from "ol/Object";
import {Feature, MapBrowserEvent} from "ol";
import {Geometry} from "ol/geom";
import {MapSingleton} from "../map";
import onMapClick from "./onMapClick";
import {IMapInteractions, ViewInteractionEventTypes} from "../../../types/InteractionsTypes";
import logger from "../../logger/logger";
import {handler as hoverOnPOIHandler} from "./hoverOnPOI";
import {mapDragEvent} from "../../gtag/mapEvents";
import ILocation from "../../../types/locationType.ts";
import {store} from "../../../store/store.ts";
import {setLocationFilter} from "../../../store/filter/filterSlice.ts";
import {transformExtent} from 'ol/proj';

const globals = {
    draggedBefore: false,
    lastSetNewLocationTimeOutId: 0,
    allowChangeStoreLocation: false,
}

const debounce = ({cb, delay}: { cb: () => void, delay: number }) => {
    clearTimeout(globals.lastSetNewLocationTimeOutId);
    globals.lastSetNewLocationTimeOutId = setTimeout(cb, delay);
}

const startDragEventIfNotHappenedBefore = (map: MapSingleton) => {
    if (globals.draggedBefore) return;
    globals.draggedBefore = true;
    mapDragEvent(map.view.getZoom() || -1)
}
const handleNewBounds = (map: MapSingleton) => {
    if(!globals.allowChangeStoreLocation) return;
    debounce({
        cb: () => {
            setNewLocationToStoreByBoundingBox(map);
        },
        delay: 500
    });
}

const setNewLocationToStoreByBoundingBox = (map: MapSingleton) => {
    const mapBounds = map.view.calculateExtent(map.ol.getSize()) as [number, number, number, number];

    const bounds = transformExtent(
        mapBounds,
        map.view.getProjection().getCode(),
        'EPSG:4326'
    ) as [number, number, number, number];

    const key = window.strings.map.locationByBoundingBox;
    const newLocation: ILocation = {
        key,
        bounds,
    }
    store.dispatch(setLocationFilter(newLocation));
};

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
            handleNewBounds(map);
        }
    }
];

export const viewInteractions: Array<{
    event: ViewInteractionEventTypes,
    handler: (map: MapSingleton) => (event: ObjectEvent) => void
}> = [
    {
        event: 'change:resolution',
        handler: (map: MapSingleton) => () => {
            handleNewBounds(map);
        }
    },
    {
        event: 'change:rotation',
        handler: (map: MapSingleton) => () => {
            handleNewBounds(map);
        }
    }
];

export const allowChangeStoreLocation = (allow: boolean) => globals.allowChangeStoreLocation = allow;

