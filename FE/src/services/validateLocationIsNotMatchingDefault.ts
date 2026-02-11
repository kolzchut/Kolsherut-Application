import ILocation from "../types/locationType";
import israelLocation from "../constants/israelLocation";

export default ({currentLocation, defaultLocation = israelLocation}: {currentLocation: ILocation, defaultLocation?:ILocation}): boolean => {
    let isMatching = true
    for (const key in defaultLocation) {
        const defaultVal = defaultLocation[key as keyof ILocation];
        const currentVal = currentLocation[key as keyof ILocation];

        if (Array.isArray(defaultVal) && Array.isArray(currentVal)) {
            if (defaultVal.length !== currentVal.length) {
                isMatching = false;
                break;
            }
            for (let i = 0; i < defaultVal.length; i++) {
                if (defaultVal[i] !== currentVal[i]) {
                    isMatching = false;
                    break;
                }
            }
            if (!isMatching) break;
        } else if (defaultVal !== currentVal) {
            isMatching = false;
            break;
        }
    }
    return !isMatching;
}
