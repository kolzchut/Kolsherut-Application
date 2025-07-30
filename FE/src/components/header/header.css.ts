import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBorderColorTwo,
    tertiaryBackgroundColorTwo
} from "../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

const buttonStyles = {
    height: 50,
    margin: 15,
    padding: 5,
    cursor: "pointer",
    borderRadius: 30,
    border : 'none',
    boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.3)',
}

const linkStyles = ({accessibilityActive}: IProps) => ({
    lineHeight: 4,
    fontSize: accessibilityActive ? 24 : 20,
    textDecoration: "none",
})

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
    inputDiv: {
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
        ...linkStyles({accessibilityActive}),
        fontWeight: 300,
        '&:hover': {
            lineHeight: 4,
            fontWeight: 400,
            textDecoration: 'underline',
            cursor: 'pointer',
        }
    }),
    accessibilityLink: ({accessibilityActive}: IProps) => ({
        ...linkStyles({accessibilityActive}),
        fontWeight: 700,
        '&:hover': {
            lineHeight: 3.5,
            fontWeight: 700,
            textDecoration: 'underline',
            cursor: 'pointer',
        }
    }),
    searchOptionsDiv: {
        width: '100%',
        position: 'absolute',
        top: 80,
    },
    button: {
        ...buttonStyles,
        background: "transparent",
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
    },
    accessibilityButton: {
        ...buttonStyles,
        background: '#208Ff3',
        boxShadow: 'inset 2px 2px 5px rgba(0, 0, 0, 0.6)',
    },
    accIcon: {
        height: '100%'
    }
});
