import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBorderColorTwo,
    tertiaryBackgroundColorTwo, primaryBackgroundColorOne, primaryTextColorOne
} from "../../services/theme";

interface IProps {
    accessibilityActive: boolean;
    isMobile: boolean;
}

export default createUseStyles({
    root: {
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        gap: 10,
        height: 80,
        color: primaryTextColorTwo,
        direction: 'ltr',
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
        '&:hover': {
            cursor: 'pointer',
        }
    },
    linksAndAcc: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    linksDiv: {
        display: "flex",
        justifyContent: "space-around",
        gap: 12,
    },
    linksAndButtonsDiv: {
        display: 'flex',
        justifyContent: 'space-between'
    },
    link: ({accessibilityActive}: IProps) => ({
        lineHeight: 4,
        fontSize: accessibilityActive ? 24 : 20,
        textDecoration: "none",
        fontWeight: 300,
        color: primaryTextColorOne,
        '&:hover': {
            lineHeight: 4,
            fontWeight: 400,
            textDecoration: 'underline',
            cursor: 'pointer',
        }
    }),
    button: ({accessibilityActive}: IProps) => {
        const styles = ({
            height: 50,
            margin: 15,
            padding: 5,
            cursor: "pointer",
            borderRadius: 30,
            border: 'none',
            background: "transparent",
            boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
        })
        if(!accessibilityActive) return styles;
        styles.boxShadow = 'inset 2px 2px 5px rgba(0, 0, 0, 0.6)';
        styles.background = '#208Ff3';
        return styles;

    },
    accIcon: {
        height: '100%',
    },
    mainInputDiv: {
        flex: 14,
    },
    inputDiv: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        direction:'rtl'
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
    input: ({accessibilityActive}: IProps) => {
        const firstBackground = tertiaryBackgroundColorTwo;
        const firstBorderColor = primaryBorderColorTwo;
        const secondBackground = secondaryBackgroundColorOne;
        const secondBorderColor = primaryTextColorTwo + '42';
        return ({
            height: "100%",
            width: '100%',
            fontSize: accessibilityActive ? '26px' : '22px',
            boxSizing: 'border-box',
            padding: '10px 5px 10px 40px',
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
    searchOptionsDiv: ({isMobile}: IProps) => {
        const style = {
            position: 'absolute',
            width:'66%',
            top: 80,
            right: 'unset',
            boxSizing: 'border-box',
            padding: '10px',
            borderBottomLeftRadius: '5px',
            borderBottomRightRadius: '5px',
            background: primaryBackgroundColorOne,
        }
        if(isMobile) {
            style.width = '100%';
            style.right = '0';
        }
        return style;
    }
}, {
    name: 'header',
});
