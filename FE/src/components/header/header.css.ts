import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne, primaryBorderColorTwo, tertiaryBackgroundColorTwo} from "../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: 80,
        color: primaryTextColorTwo,
        direction: 'rtl',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '10px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.14)',
        position: 'relative',
        zIndex: 1
    },
    logo: {
        flex: 1,
        height: 40,
        '&:hover':{
            cursor: 'pointer',
        }
    },
    inputDiv: {
        flex: 14,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
    },
    searchIcon: {
        position: 'absolute',
        left: 10,
    },
    visuallyHidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
    },
    input: () => {
        const firstBackground = tertiaryBackgroundColorTwo;
        const firstBorderColor = primaryBorderColorTwo;
        const secondBackground = secondaryBackgroundColorOne;
        const secondBorderColor = primaryTextColorTwo + '42';
        return ({
            height: "100%",
            width: '100%',
            fontSize: '22px',
            boxSizing: 'border-box',
            padding: '10px',
            borderRadius: '5px',
            background: firstBackground,
            border: `2px solid ${firstBorderColor}`,
            '&:hover': {
                background: secondBackground,
                border: `2px solid ${secondBorderColor}`,
            },
            '&:focus': {
                background: secondBackground,
                border: `2px solid ${primaryTextColorTwo}`,
                outline: 'none'
            }
        })
    },
    linksDiv: {
        flex: 6,
        display: "flex",
        justifyContent: "space-around",
    },
    link: {
        lineHeight: 4,
        fontSize: 20,
        fontWeight: 300,
        textDecoration: "none",
        '&:hover': {
            fontWeight: 400,
            textDecoration: 'underline',
            cursor: 'pointer',
        }
    }
});
