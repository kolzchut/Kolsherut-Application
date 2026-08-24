import {createUseStyles} from 'react-jss';
import {
    primaryTextColorOne,
    primaryBorderColorOne,
    tertiaryBackgroundColorTwo,
    primaryBackgroundColorOne,
    quaternaryBackgroundColorOne
} from "../../../../../services/theme";
import {widthOfMobile} from "../../../../../constants/mediaQueryProps";

const mobileMediaQuery = `@media (max-width: ${widthOfMobile}px)`;

const aTagMobileStyle = {
    fontSize: '14px',
    gap: '4px',
};

const aTagGeneralStyle = {
    display: 'flex',
    alignItems: 'center',
    paddingRight: '10px',
    paddingLeft: '20px',
    flexDirection: 'row' as const,
    justifyContent: 'center',
    gap: '10px',
    borderRadius: '10px',
    height: '40px',
    flex: 1,
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.2s, box-shadow 0.2s',

    '&:hover': {
        boxShadow: '0 2px 7px rgba(0, 0, 0, 0.4)',
    },
    '&:focus': {
        outline: '2px solid #007BFF',
        outlineOffset: '2px',
    },
    [mobileMediaQuery]: aTagMobileStyle,
};

// `aTagA11y` is a static rule applied alongside aTagTel/aTagGeneral rather than an
// `accessibilityActive` branch inside a function rule - see the note in
// pages/home/search/searchInput/searchInput.css.ts for why an `@media` block must never
// live inside a function rule. It is declared after both base rules on purpose: all three
// are single-class selectors, so document order decides which font size wins.
export default createUseStyles({
    mainDiv: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        height: '56px',
        gap: '8px',
        boxSizing: 'border-box',
        backgroundColor: tertiaryBackgroundColorTwo,
        [mobileMediaQuery]: {
            padding: '8px 12px',
            gap: '4px',
        }
    },
    aTagTel: {
        ...aTagGeneralStyle,
        border: 'none',
        backgroundColor: quaternaryBackgroundColorOne,
        color: primaryBackgroundColorOne,
        flex: 3,
        // Replaces the shared mobile block rather than extending it, so the phone button
        // keeps the desktop font-size and gap on mobile. Preserved as-is: the spread above
        // always behaved this way, and changing it here would resize the button.
        [mobileMediaQuery]: {
            flex: 4,
        }
    },
    aTagGeneral: {
        ...aTagGeneralStyle,
        border: `1px solid ${primaryBorderColorOne}`,
        backgroundColor: primaryBackgroundColorOne,
        color: primaryTextColorOne,
        flex: 2
    },
    aTagA11y: {
        fontSize: '20px',
        [mobileMediaQuery]: {
            fontSize: '18px',
        }
    },
    aTagImage: {
        height: '60%'
    },

});
