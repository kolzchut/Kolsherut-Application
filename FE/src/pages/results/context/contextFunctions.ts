import {createContext, useContext} from "react";

export interface UIContextType {
    distanceFromTop: number;
    setDistanceFromTop: (distance: number) => void;
    displayResultsMap: boolean;
    setDisplayResultsMap: (display: boolean) => void;
}

export const UIContext = createContext<UIContextType | null>(null);

const useUI = () => {
    const UIContextData = useContext(UIContext);

    if (!UIContextData) {
        throw new Error(
            "useUI has to be used within <UIContext.Provider>"
        );
    }
    return UIContextData;
};

export const useDistanceFromTop = () => {
    const { distanceFromTop } = useUI();
    return distanceFromTop;
};

export const useSetDistanceFromTop = () => {
    const { setDistanceFromTop } = useUI();
    return setDistanceFromTop;
};

export const useDisplayResultsMap = () => {
    const { displayResultsMap } = useUI();
    return displayResultsMap;
};

export const useSetDisplayResultsMap = () => {
    const { setDisplayResultsMap } = useUI();
    return setDisplayResultsMap;
};


