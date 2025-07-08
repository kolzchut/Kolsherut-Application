import {ReactNode, useState} from "react";
import {UIContext} from "./contextFunctions";

export const UIProvider = ({ children }: { children: ReactNode }) => {
    const [distanceFromTop, setDistanceFromTop] = useState<number>(0);
    const [displayResultsMap, setDisplayResultsMap] = useState<boolean>(false);
    const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
    return (
        <UIContext.Provider value={{distanceFromTop, setDistanceFromTop, displayResultsMap, setDisplayResultsMap, showFiltersModal, setShowFiltersModal}}>
            {children}</UIContext.Provider>);
}
