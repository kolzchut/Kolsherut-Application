import {ObjectEvent} from "ol/Object";
import {mapInteractions as IMapInteractions, ViewInteractionEventTypes} from "../../types/InteractionsTypes";
import logger from "../logger/logger";
import onMapClick from "./onMapClick";
import {MapSingleton} from "./map";
import {Feature, MapBrowserEvent} from "ol";
import {Geometry} from "ol/geom";

export const mapInteractions:IMapInteractions = [
    {
        event: 'click', handler: (map: MapSingleton) => (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => {
            onMapClick(event, map.ol, (selectedFeature: Feature<Geometry>) => {logger.log({message:"replace with Show only selected feature to display the selected feature (poi or route)", payload:selectedFeature})});
        }
    },
]

export const viewInteractions: Array<{
    event: ViewInteractionEventTypes,
    handler: (map: MapSingleton) => (event: ObjectEvent) => void
}> = [

]
