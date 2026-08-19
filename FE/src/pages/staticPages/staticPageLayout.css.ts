import {createUseStyles} from 'react-jss';
import {widthOfMobile} from "../../constants/mediaQueryProps";

interface IProps {
    isMobile: boolean;
}

const mobileMediaQuery = `@media (max-width: ${widthOfMobile}px)`;

// Mirrors the home page layout (see pages/home/home.css.ts) on purpose rather than importing
// it, so that tweaking a content page can never regress the home page.
export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        direction: 'rtl',
        width: '100%',
        justifyContent: 'space-between',
        [mobileMediaQuery]: {
            height: 'fit-content',
            flexDirection: 'column',
        }
    },
    // display:contents keeps <Search/> a direct flex child of root so it keeps its
    // flex:4 / maxWidth:750 sizing. Hiding it here is pure CSS, so the prerendered
    // desktop HTML already renders correctly on a phone before any JS runs.
    hero: {
        display: 'contents',
        [mobileMediaQuery]: {
            display: 'none',
        }
    },
    main: ({isMobile}: IProps) => ({
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        flex: 6,
        minHeight: 0,
        overflowY: isMobile ? 'visible' : 'auto',
        scrollbarWidth: 'none',
    }),
    content: ({isMobile}: IProps) => ({
        width: '100%',
        boxSizing: 'border-box',
        direction: 'rtl',
        padding: isMobile ? '24px 16px' : '24px 40px',
    }),
    footerContainer: {
        width: '100%',
        marginTop: 'auto',
    }
});
