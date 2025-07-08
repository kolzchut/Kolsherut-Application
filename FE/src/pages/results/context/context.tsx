import {ReactNode, useState} from "react";
import {UIContext} from "./contextFunctions";

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [distanceFromTop, setDistanceFromTop] = useState<number>(0);
    const [displayResultsMap, setDisplayResultsMap] = useState<boolean>(false);
    const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
    const [showGeoModal, setShowGeoModal] = useState<boolean>(false);
    return (
        <UIContext.Provider value={{distanceFromTop, setDistanceFromTop, displayResultsMap, setDisplayResultsMap, showFiltersModal, setShowFiltersModal,showGeoModal, setShowGeoModal}}>
            {children}</UIContext.Provider>);
}
