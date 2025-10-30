import {createUseStyles} from 'react-jss';
import {secondaryBackgroundColorTwo} from "../../services/theme";

interface IProps {
    displayResultsMap: boolean,
    openSecondList: boolean,
    isMobile: boolean,
}

export default createUseStyles({
    mainDiv: {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: 'calc(100vh - 80px)',
        backgroundColor: secondaryBackgroundColorTwo,
        position: 'relative',
        direction: "rtl",
        "@media (max-width: 768px)": {
            flexDirection: 'column',
            height: 'fit-content',
        }
    },
    resultsContainer: {
        flex: 10,
        height: "100%",
        width: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'row',
        scrollbarWidth: "none"
    },
    branchList: ({displayResultsMap, openSecondList, isMobile}:IProps) => {
        if (!isMobile) return ({
            width: openSecondList ? "30%" : "0%",
            position: 'relative',
        })
        return ({
            height: openSecondList ? 'calc(100vh - 191px)' : 'fit-content',
            position: 'relative',
            display: displayResultsMap ? 'none' : 'flex',
            flexDirection: 'column',
            width: openSecondList ? "100%" : "0%",
        })
    },
    mapContainer: ({openSecondList, displayResultsMap, isMobile}: IProps) => {
        const showLargeMap = displayResultsMap && !openSecondList;
        const showSmallMap = displayResultsMap && openSecondList;
        const mapFlex = showLargeMap ? 10 : showSmallMap ? 4 : 0;
        if (!isMobile) return ({
            flex: mapFlex,
            position: 'sticky',
            width: '100%',
            height: 'calc(100vh - 80px)',
            transition: 'flex 0.2s ease-in-out',
        })
        return ({
            height: 'calc(100vh - 191px)',
            display: displayResultsMap ? 'block' : 'none',
            top: 0,
            left: 0,
        })
    },
    loading: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    loadingIcon: {
        width: '50%',
        height: '50%',
        marginTop: '20px',
    },
});
