import {store} from "../store/store";
import {setLocations} from "../store/data/dataSlice";
import map from "./map/map";
import locations from "../assets/locations.json"
import logger from "./logger/logger";
import {allowChangeStoreLocation, getAllowChangeStoreLocation} from "./map/events/mapInteraction.ts";

interface ICheckIfCoordinatesInBounds {
    bounds: [number, number, number, number],
    coordinates: [number, number]
}

export const setAllLocationsInStore = () => store.dispatch(setLocations(locations))

export const checkIfCoordinatesInBounds = ({bounds, coordinates}: ICheckIfCoordinatesInBounds) => {
    if (!bounds || !coordinates) return false;
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const [lng, lat] = coordinates;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
};

export const getCenterOfBounds = (bounds: [number, number, number, number]) => {
    if (!bounds) return null;
    const [minLng, minLat, maxLng, maxLat] = bounds;
    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    return {x: centerLng, y: centerLat};
};

export const centerByLocation = (bounds: [number, number, number, number], zoom = 12): void => {
    if (!Array.isArray(bounds) || bounds.length !== 4) {
        logger.error({message: 'Invalid bounds:', payload: bounds});
        return;
    }
    const center = getCenterOfBounds(bounds);
    if (!center) return;
    const previousAllowChangeStoreLocation = getAllowChangeStoreLocation();
    allowChangeStoreLocation(false);
    map.gotoLocation({coordinates: [center.x, center.y], zoom})
    allowChangeStoreLocation(previousAllowChangeStoreLocation);

}

export const getCurrentLocationBounds = (): Promise<{ bounds: [number, number, number, number] } | null> => {
    return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const {latitude, longitude} = position.coords;
                const bounds: [number, number, number, number] = [
                    longitude - 0.1, // minLng
                    latitude - 0.1,  // minLat
                    longitude + 0.1, // maxLng
                    latitude + 0.1   // maxLat
                ];
                resolve({bounds});
            },
            (error) => {
                logger.warning({message: 'Error getting location:', payload: error});
                resolve(null);
            }
        );
    });
};

