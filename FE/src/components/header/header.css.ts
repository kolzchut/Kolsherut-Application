import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    primaryTextColorOne
} from "../../services/theme";
import IDynamicThemeApp from "../../types/dynamicThemeApp.ts";

export default createUseStyles((theme: IDynamicThemeApp) => ({
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
        width: 'auto',
        '&:hover': {
            cursor: 'pointer',
        }
    },
    linksAndAcc: {
        display: 'flex',
        justifyContent: 'space-between',
    },
    linksDiv: {
        direction:"rtl",
        display: "flex",
        justifyContent: "space-around",
        gap: 12,
        width: '100%',
    },
    linksAndButtonsDiv: {
        display: 'flex',
        justifyContent: 'space-between',
        flex:8,
        maxWidth: 500,
    },
    link: {
        lineHeight: 4,
        fontSize: theme?.accessibilityActive ? 24 : 20,
        textDecoration: "none",
        fontWeight: 300,
        color: primaryTextColorOne,
        '&:hover': {
            lineHeight: 4,
            fontWeight: 400,
            textDecoration: 'underline',
            cursor: 'pointer',
        }
    },
    button: {
        height: 50,
        margin: 15,
        padding: 5,
        cursor: "pointer",
        borderRadius: 30,
        border: 'none',
        background: theme?.accessibilityActive ? '#208Ff3' : "transparent",
        boxShadow: theme?.accessibilityActive ?
            'inset 2px 2px 5px rgba(0, 0, 0, 0.6)' :
            '2px 2px 5px rgba(0, 0, 0, 0.3)',
    },
    accIcon: {
        height: 40,
        width: 'auto',
    },
}));
