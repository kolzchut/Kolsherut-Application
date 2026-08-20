import {createUseStyles} from 'react-jss';
import {primaryBorderColorOne, secondaryTextColorOne} from "../../../../../services/theme";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps";

const mobileMediaQuery = `@media (max-width: ${widthOfMobile}px)`;

// `iconAndTextA11y` is a static sibling rule rather than an `accessibilityActive` branch
// inside a function rule - see the note in ../searchInput.css.ts for why an `@media` block
// must never live inside a function rule. This list remounts on every keystroke.
export default createUseStyles({
    optionalSearchValue: {
        borderBottom: `1px dotted ${primaryBorderColorOne}`,
        lineHeight: 1.1,
        padding: '10px 0',
        maxHeight: '50px',
        width: '100%',
        display: 'flex',
        flexDirection: "row",
        justifyContent: 'space-between',
        direction: 'rtl',
        alignItems: 'center',
        cursor: 'pointer',
    },
    searchIcon: {
        height: '30px',
        [mobileMediaQuery]: {
            height: '20px',
        }
    },
    iconAndText: {
        display: 'flex',
        alignItems: 'center',
        color: secondaryTextColorOne,
        gap: 10,
        paddingRight: 10,
        fontSize: 24,
        [mobileMediaQuery]: {
            fontSize: 20,
        },
    },
    iconAndTextA11y: {
        fontSize: 28,
        [mobileMediaQuery]: {
            fontSize: 24,
        },
    },
    boldText:{
        fontWeight: 'bold',
    }
});
