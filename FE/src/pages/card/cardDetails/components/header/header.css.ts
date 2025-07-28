import {createUseStyles} from 'react-jss';
import {
    tertiaryTextColorOne,
    tertiaryBackgroundColorTwo,
    primaryTextColorThree,
    secondaryTextColorOne
} from "../../../../../services/theme";

export default createUseStyles({
    root: {
        display: "flex",
        flexDirection: "row",
        boxSizing: 'border-box',
        padding: 20,
        width: '100%',
        backgroundColor: tertiaryBackgroundColorTwo,
        boxShadow: "0 4px 8px #0000001a",
        fontSize: 16,
        color: tertiaryTextColorOne,

    },
    backButtonDiv: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    backButton: {
        background: 'transparent',
        border: `1px solid ${secondaryTextColorOne}`,
        height: 30,
        width: 30,
        borderRadius: 15,
        cursor: 'pointer',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
        '&:hover': {
            transform: 'scale(1.05)',
            transition: 'transform 0.2s ease-in-out',
        }
    },
    backButtonImg: {
        height: '100%',
        width: '100%',
    },
    header: {
        flex: 8,
        display: 'flex',
        flexDirection: 'column',
    },
    headerTitle: {
        fontWeight: 600
    },
    headerSubtitle: {
        fontWeight: 300
    },
    nationWideText: {
        color: primaryTextColorThree,
        fontWeight: 600
    }
});
