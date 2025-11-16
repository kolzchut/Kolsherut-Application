import {createUseStyles} from 'react-jss';

interface IProps {
    displayResultsMap: boolean,
    openSecondList: boolean,
    isMobile: boolean,
    accessibilityActive: boolean
}

export default createUseStyles({
    hits: ({displayResultsMap, openSecondList, isMobile}: IProps) => {
        if (!isMobile) return ({
            width: displayResultsMap && !openSecondList ? "100%" : "70%",
        })
        return ({
            height: 'calc(100vh - 191px)',
            overflowY: 'auto',
            display: (displayResultsMap || openSecondList) ? 'none' : 'flex',
            flexDirection: 'column',
            width: !openSecondList ? "100%" : "0%",
        })
    },
    noResults: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'relative'
    },
    noResultsIcon: {
        width: '20%',
        marginTop: '20px',
    },
    noResultsTitle: ({accessibilityActive, isMobile}: IProps) => {
        const fontSizeMobile = accessibilityActive ? 28:24;
        const fontSizeDesktop = accessibilityActive ? 38 : 34;
        const fontSize = isMobile ? fontSizeMobile : fontSizeDesktop;

        return ({
            fontSize,
            textAlign: 'center',
            fontWeight: 700,
        })
    },
    noResultsSearchQuery: ({accessibilityActive, isMobile}: IProps) => {
        const fontSizeMobile = accessibilityActive ? 28:24;
        const fontSizeDesktop = accessibilityActive ? 38 : 34;
        const fontSize = isMobile ? fontSizeMobile : fontSizeDesktop;

        return ({
            fontSize,
            textAlign: 'center',
            fontWeight: 500,
        })
    },
    noResultsSubtitle: ({accessibilityActive, isMobile}: IProps) => {
        const fontSizeMobile = accessibilityActive ? 24:20;
        const fontSizeDesktop = accessibilityActive ? 34 : 30;
        const fontSize = isMobile ? fontSizeMobile : fontSizeDesktop;
        return ({
            marginTop: 10,
            fontSize,
            fontWeight: 500,
            textAlign: 'center',
        })
    },

});
