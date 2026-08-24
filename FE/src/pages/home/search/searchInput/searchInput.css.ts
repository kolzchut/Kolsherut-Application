import {createUseStyles} from 'react-jss';
import {primaryTextColorThree, primaryBackgroundColorOne} from "../../../../services/theme";
import {widthOfMobile} from "../../../../constants/mediaQueryProps";

interface IProps {
    moveUp: boolean;
}

const mobileMediaQuery = `@media (max-width: ${widthOfMobile}px)`;

// The accessibility font sizes live in their own static `*A11y` rules, applied alongside the
// base class, instead of inside a `({accessibilityActive}) => ({...})` rule. react-jss v10
// re-creates a function rule per component instance on every mount, and that add/remove
// cycle silently drops nested `@media` blocks once the component has remounted - taking
// every later function rule of the same sheet down with it. A page change in App.tsx swaps
// the whole component tree, so SearchInput remounts constantly and used to end up with a
// class name that matched no rule at all. Keep these rules static: never move an `@media`
// block back into a function rule. `*A11y` must stay declared right after its base rule,
// since both are single-class selectors and document order decides the winner.
export default createUseStyles({
    root: {
        width: "100%",
        display: 'flex',
        justifyContent: 'center',
        height: '100%',
        alignItems: 'center',
        flexDirection: 'column',
        position: "relative",
        [mobileMediaQuery]: {
            height: '40vh',
        }
    },
    searchContainer: ({moveUp}: IProps) => ({
        position: 'relative',
        width: '80%',
        height: moveUp ? "60%" : '10%',
        transition: 'height 0.3s ease-in-out',
    }),
    searchInput: {
        width: '100%',
        padding: '10px 80px 10px 60px',
        boxSizing: 'border-box',
        border: `1px solid ${primaryTextColorThree}`,
        borderRadius: 10,
        fontSize: 24,
        direction: 'rtl',
        backgroundColor: primaryBackgroundColorOne,
        '&:focus': {
            outline: '2px solid royalblue',
        },
        '&:hover': {
            outline: '2px solid royalblue',
        },
        '&::placeholder': {
            color: primaryTextColorThree,
        },
        [mobileMediaQuery]: {
            fontSize: 18,
            padding: '10px 55px 10px 55px',
        }
    },
    searchInputA11y: {
        fontSize: 28,
        [mobileMediaQuery]: {
            fontSize: 22,
        }
    },
    searchButton: {
        position: 'absolute',
        right: 30,
        height: 30,
        border: 'none',
        padding: '10px',
        borderRadius: 10,
        [mobileMediaQuery]: {
            height: 24,
            right: 18,
        }
    },
    optionalSearchValuesWrapper: {
        marginTop: 5,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        backgroundColor: primaryBackgroundColorOne,
    },
    mainTextDiv: {
        display: 'flex',
    },
    mainText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 300,
        lineHeight: 1.3,
        paddingBottom: '10px',
        color: primaryBackgroundColorOne,
        whiteSpace: 'pre-line',
        [mobileMediaQuery]: {
            fontSize: 18,
        }
    },
    mainTextA11y: {
        fontSize: 28,
        [mobileMediaQuery]: {
            fontSize: 22,
        }
    },
    mainTextBold: {
        fontWeight: 600,
    },
    closeIconButton: {
        position: 'absolute',
        left: 30,
        height: 30,
        borderRadius: 10,
        padding: '10px',
        border: 'none',
        background: 'none',
        '&:hover': {
            cursor: 'pointer',
        },
        [mobileMediaQuery]: {
            height: 24,
            left: 18,
        }
    },
    closeIconImg: {
        height: '30px',
        [mobileMediaQuery]: {
            height: 24,
        }
    }
});
