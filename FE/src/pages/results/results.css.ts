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
    },
    resultsContainer: {
        flex:6,
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'row',
        scrollbarWidth:"none"
    },
    hits:({displayResultsMap,isSelectedOrganization}:{displayResultsMap:boolean,isSelectedOrganization:boolean}) => ({
        width: displayResultsMap && !isSelectedOrganization ? "100%": "55%",
    }),
    branchList:({isSelectedOrganization}:{displayResultsMap:boolean,isSelectedOrganization:boolean}) => ({
        width: isSelectedOrganization? "45%": "0%",
        position: 'relative'
    }),
    mapContainer:({isSelectedOrganization,displayResultsMap}:{displayResultsMap:boolean,isSelectedOrganization:boolean}) => {
        const showLargeMap = displayResultsMap && !isSelectedOrganization;
        const showSmallMap = displayResultsMap && isSelectedOrganization;
        const mapFlex = showLargeMap ? 6 : showSmallMap ? 3 : 0;
        return {
            flex:mapFlex,
            position: 'sticky',
            width: '100%',
            height: 'calc(100vh - 80px)',
            transition: 'flex 0.2s ease-in-out',
        }
    }
});
