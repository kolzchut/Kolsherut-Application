import {createUseStyles} from 'react-jss';
import {brightBlueOne} from "../../services/theme";

export default createUseStyles({
    mainDiv: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: 'calc(100vh - 80px)',
        backgroundColor: brightBlueOne,
        position: 'relative',
        direction: "rtl",
        "@media (max-width: 768px)": {
            flexDirection: 'column',
            height: 'fit-content',
        }
    },
    resultsContainer: {
        flex: 6,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'row',
        scrollbarWidth: "none"
    },
    hits: ({displayResultsMap, isSelectedOrganization, isMobile}: {
        displayResultsMap: boolean,
        isSelectedOrganization: boolean,
        isMobile: boolean
    }) => {
        if (!isMobile) return ({
            width: displayResultsMap && !isSelectedOrganization ? "100%" : "55%",
        })
        return ({
            display: (displayResultsMap || isSelectedOrganization) ? 'none' : 'flex',
            flexDirection: 'column',
            width: !isSelectedOrganization ? "100%" : "0%",
        })
    },
    branchList: ({displayResultsMap, isSelectedOrganization, isMobile}: {
        displayResultsMap: boolean,
        isSelectedOrganization: boolean,
        isMobile: boolean
    }) => {
        if (!isMobile) return ({
            width: isSelectedOrganization ? "45%" : "0%",
            position: 'relative',
        })
        return ({
            height: isSelectedOrganization ?'100vh': 'fit-content',
            position: 'relative',
            display: displayResultsMap ? 'none' : 'flex',
            flexDirection: 'column',
            width: isSelectedOrganization ? "100%" : "0%",
        })
    },
    mapContainer: ({isSelectedOrganization, displayResultsMap, isMobile}: {
        displayResultsMap: boolean,
        isSelectedOrganization: boolean,
        isMobile: boolean
    }) => {
        const showLargeMap = displayResultsMap && !isSelectedOrganization;
        const showSmallMap = displayResultsMap && isSelectedOrganization;
        const mapFlex = showLargeMap ? 6 : showSmallMap ? 3 : 0;
        if (!isMobile) return ({
            flex: mapFlex,
            position: 'sticky',
            width: '100%',
            height: 'calc(100vh - 80px)',
            transition: 'flex 0.2s ease-in-out',
        })
        return ({
            height: 'calc(100vh - 130px)',
            display: displayResultsMap ? 'block' : 'none',
            top: 0,
            left: 0,
        })
    }
});
