import {createUseStyles} from 'react-jss';
import {royalBlue, white} from "../../../../services/theme";

export default createUseStyles({
    root: {
        width: "100%",
        display: 'flex',
        justifyContent: 'center',
        height: '100%',
        alignItems: 'center',
        flexDirection: 'column',
        position: "relative",
        "@media (max-width: 768px)": {
            height: '40vh',
        }
    },
    searchContainer: ({moveUp}: { moveUp: boolean }) => ({
        position: 'relative',
        width: '80%',
        height: moveUp ? "60%" : '10%',
        transition: 'height 0.3s ease-in-out',
    }),
    searchInput: {
        width: '100%',
        padding: '10px 80px 10px 60px',
        boxSizing: 'border-box',
        border: `1px solid ${royalBlue}`,
        borderRadius: 10,
        fontSize: 24,
        direction: 'rtl',
        backgroundColor: white,
        '&:focus': {
            outline: '2px solid royalblue',
        },
        '&:hover': {
            outline: '2px solid royalblue',
        },
        '&::placeholder': {
            color: royalBlue,
        },
        "@media (max-width: 768px)": {
            fontSize: 18,
            padding: '10px 55px 10px 55px',

        }

    },
    searchButton: {
        position: 'absolute',
        right: 30,
        height: 30,
        border: 'none',
        padding: '10px',
        borderRadius: 10,
        "@media (max-width: 768px)": {
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
        backgroundColor: white,
    },
    mainTextDiv: {
        display: 'flex',
    },
    mainText: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: 300,
        lineHeight: 1.3,
        paddingBottom:'10px',
        color: white,
        whiteSpace: 'pre-line',
        "@media (max-width: 768px)": {
            fontSize: 18,
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
        "@media (max-width: 768px)": {
            height: 24,
            left: 18,

        }
    },
    closeIconImg: {
        height: '30px',
        "@media (max-width: 768px)": {
            height: 24,
        }
    }
});
