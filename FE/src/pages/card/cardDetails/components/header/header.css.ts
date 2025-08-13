import {createUseStyles} from 'react-jss';
import {
    tertiaryTextColorOne,
    tertiaryBackgroundColorTwo,
    primaryTextColorThree,
    primaryTextColorOne,
} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({accessibilityActive}: IProps) => ({
        display: "flex",
        flexDirection: "row",
        boxSizing: 'border-box',
        justifyContent:'space-between',
        padding: 20,
        width: '100%',
        backgroundColor: tertiaryBackgroundColorTwo,
        boxShadow: "0 4px 8px #0000001a",
        fontSize: accessibilityActive ? 20 : 16,
        color: tertiaryTextColorOne,
        alignItems: "center",

    }),
    backButtonDiv: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding:10,
    },
    backButton: {
        background: 'transparent',
        border: `none`,
        outline:0,
        height: 30,
        width: 30,
        borderRadius: 15,
        cursor: 'pointer',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.3)',
        '&:hover': {
            transform: 'scale(1.05)',
            transition: 'transform 0.2s ease-in-out',
        },
        '&:focus': {
            border: `2px solid ${primaryTextColorOne}`,
            outline: 'none',
            transform: 'scale(1.05)',
            transition: 'all 0.2s ease-in-out',
        },
        '&:focus-visible': {
            border: `2px solid ${primaryTextColorOne}`,
            outline: 'none',
            transform: 'scale(1.05)',
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
    },
    headerIcon:{
        height:40,
    }
});
