import View from "ol/View";
import {Attribution} from 'ol/control';
import Map from "ol/Map";
import {Feature} from "ol";
import {Geometry} from "ol/geom";
import VectorSource from "ol/source/Vector";
import initLayers from "./layers";
import {getSources} from "./sources";
import view, {setViewPort} from "./view";
import {MapInitParams} from "../../types/InteractionsTypes";
import Overlay from "ol/Overlay";
import nationalServiceNotification from "./style/nationalServiceNotification/nationalServiceNotification";
import {fromLonLat} from "ol/proj";
import {XYZ} from "ol/source";
import {GetLayersReturn} from "../../types/layers";

const attribution = new Attribution({
    collapsible: false,
});
export class MapSingleton {
    readonly ol: Map;
    public readonly view: View;
    public layers: GetLayersReturn | undefined;
    public sources: {
        osm: XYZ;
        poiSource: VectorSource<Feature<Geometry>>;
        israelBorderSource: VectorSource<Feature<Geometry>>;
    } | null;
    private popupOverlay?: Overlay;
    public constructor() {
        this.layers = undefined;
        this.sources = null;
        this.view = view;
        this.ol = new Map({
            view: this.view,
            layers: this.layers,
            controls: [attribution],
        });
    };

    public init({mapInteractions, viewInteractions}: MapInitParams) {
        this.sources = getSources();
        initLayers(this);
        if(this.layers)
        this.ol.setLayers(this.layers);
        setViewPort({});

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
    public setPopupOverlay(popupContainer: HTMLElement) {
        if (this.popupOverlay) {
            this.ol.removeOverlay(this.popupOverlay);
        }
        this.popupOverlay = new Overlay({
            element: popupContainer,
            positioning: "bottom-center",
            stopEvent: true,
            insertFirst:false,
        });
        this.ol.addOverlay(this.popupOverlay);
    }

    public getPopupOverlay() {
        return this.popupOverlay;
    }

    public disableMovement(disable: boolean) {
        this.ol.getInteractions().forEach(interaction => {
            interaction.setActive(!disable);
        });
    }

    public showNotification(message: string) {
        const notificationElement = nationalServiceNotification({message})
        const targetElement = this.ol.getTargetElement();
        if (targetElement) {
            targetElement.appendChild(notificationElement);
        }
    }
    public gotoLocation({zoom = 12,coordinates}:{zoom?: number, coordinates: [number, number]}) {
        this.view.setCenter(fromLonLat(coordinates));
        this.view.setZoom(zoom);
    }

    public removeNotification() {
        const targetElement = this.ol.getTargetElement();
        if (targetElement) {
            const notificationElement = targetElement.querySelector('.map-notification');
            if (notificationElement) {
                targetElement.removeChild(notificationElement);
            }
        }
    }

}

const map = new MapSingleton();
export default map;
