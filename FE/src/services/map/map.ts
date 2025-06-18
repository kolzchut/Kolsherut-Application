import View from "ol/View";
import {defaults as defaultControls} from 'ol/control';
import Map from "ol/Map";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import initLayers from "./layers";
import OSM from "ol/source/OSM";
import {getSources} from "./sources";
import view, {setViewPort} from "./view";
import {MapInitParams} from "../../types/InteractionsTypes";
import TileLayer from "ol/layer/Tile";

export class MapSingleton {
    readonly ol: Map;
    public readonly view: View;
    public layers: [TileLayer<OSM>, VectorLayer<VectorSource<Feature<Geometry>>>] | undefined;
    public sources: {
        osmSource: OSM;
        poiSource: VectorSource<Feature<Geometry>>;
    } | null;

    public constructor() {
        this.layers = undefined;
        this.sources = null;
        this.view = view;
        this.ol = new Map({
            view: this.view,
            layers: this.layers,
            controls: defaultControls({
                rotateOptions: {autoHide: false}
            }),
        });
    };

    public init({mapInteractions, viewInteractions}: MapInitParams) {
        this.sources = getSources();
        initLayers(this);
        this.ol.setLayers(this.layers);
        setViewPort();

        mapInteractions.forEach(({event, handler}) => {
            this.ol.on(event, handler(this));
        });
        viewInteractions.forEach(({event, handler}) => {
            this.view.on(event, handler(this));
        });
    }

    public setTarget(target: HTMLElement | string) {
        this.ol.setTarget(target);
    };
}

const map = new MapSingleton();
export default map;
