import {MapBrowserEvent} from "ol";
import {MapSingleton} from "../services/map/map";
import {ObjectEvent} from "ol/Object";

export type MapInteractionEventTypes = 'click' | 'pointermove' | 'pointerdrag';
export type ViewInteractionEventTypes = 'change:resolution' | 'change:rotation';

export type IMapInteractions = Array<{
    event: MapInteractionEventTypes,
    handler: (m: MapSingleton) => (event: MapBrowserEvent<PointerEvent | KeyboardEvent | WheelEvent>) => void
}>;
export type viewInteractions = Array<{
    event: ViewInteractionEventTypes,
    handler: (m: MapSingleton) => (event: ObjectEvent) => void
}>;
export type MapInitParams = {
    mapInteractions: IMapInteractions;
    viewInteractions: viewInteractions;
}
