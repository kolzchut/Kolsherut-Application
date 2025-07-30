import {createUseStyles} from 'react-jss';
import {secondaryTextColorTwo, tertiaryTextColorThree, primaryTextColorThree, primaryBackgroundColorOne} from "../../services/theme";

export default createUseStyles({
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
    emergencyIcon: {
        height: '18px',
        left: '5px',
        top: '5px',
        position: 'absolute',
    },
    bannerTitle:({accessibilityActive}: { accessibilityActive: boolean }) => ({
        color: secondaryTextColorTwo,
        fontWeight:300,
        lineHeight: 1.4,
        fontSize: accessibilityActive ? '24px' : '20px',
        margin: 0,
        width: 'calc(100% - 30px)',
    }),
    bannerDescriptionDiv:{
        display:"flex",
        width: '100%',
        flexDirection: 'row',
    },
    bannerDescriptionShort:({accessibilityActive}: { accessibilityActive: boolean }) => ({
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:'pre-wrap',
        fontWeight:400,
        lineHeight:'normal',
        fontSize: accessibilityActive ? '20px': '16px',
        color:tertiaryTextColorThree
    }),
    bannerDescriptionLong:({accessibilityActive}: { accessibilityActive: boolean }) => ({
        display: '-webkit-box',
        WebkitLineClamp: 20,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace:'pre-wrap',
        fontWeight:400,
        lineHeight:'normal',
        fontSize: accessibilityActive ? '20px': '16px',
        color:tertiaryTextColorThree
    }),
    bannerDescriptionButton:({accessibilityActive}: { accessibilityActive: boolean }) => ({
        display:'flex',
        alignItems:'flex-end',
        background: "transparent",
        color:primaryTextColorThree,
        fontWeight:500,
        fontSize: accessibilityActive? '20px':'16px',
        border: "none",
        cursor:'pointer',
        '&:hover': {
            textDecoration: 'underline',
        }
    }),
    linksDiv:{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
    }

});
