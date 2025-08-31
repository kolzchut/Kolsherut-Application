import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorTwo, primaryTextColorThree, primaryBackgroundColorOne,
    tertiaryTextColorFour, tertiaryTextColorFive
} from "../../services/theme";

export interface IDynamicTheme {
    isMobile: boolean;
    accessibilityActive: boolean;
}

export default createUseStyles((theme: IDynamicTheme) => ({
    aTag: {
        textDecoration: "none",
        '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-2px)',
        },
    },
    cardBanner: {
        width: '100%',
        position: 'relative',
        padding: '10px',
        boxSizing: 'border-box',
        backgroundColor: primaryBackgroundColorOne,
        borderRadius: 2,
    },
    bannerTitle: {
        color: secondaryTextColorTwo,
        fontWeight:300,
        lineHeight: 1.4,
        fontSize: theme?.accessibilityActive ? '28px' : '24px',
        margin: 0,
        width: 'calc(100% - 30px)',
    },
    bannerDescriptionDiv:{
        display:"flex",
        width: '100%',
        flexDirection: 'row',
    },
    bannerDescriptionShort: {
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:'pre-wrap',
        fontWeight:400,
        lineHeight:'normal',
        fontSize: theme?.accessibilityActive ? '20px': '16px',
        color:theme?.accessibilityActive ?tertiaryTextColorFour: tertiaryTextColorFive
    },
    bannerDescriptionLong: {
        display: '-webkit-box',
        WebkitLineClamp: 20,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:'pre-wrap',
        fontWeight:400,
        lineHeight:'normal',
        fontSize: theme?.accessibilityActive ? '20px': '16px',
        color: theme?.accessibilityActive ?tertiaryTextColorFour: tertiaryTextColorFive
    },
    bannerDescriptionButton: {
        display:'flex',
        alignItems:'flex-end',
        background: "transparent",
        color:primaryTextColorThree,
        fontWeight:500,
        fontSize: theme?.accessibilityActive ? '20px':'16px',
        border: "none",
        cursor:'pointer',
        '&:hover': {
            textDecoration: 'underline',
        }
    },
    linksDiv:{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
    }

}));
