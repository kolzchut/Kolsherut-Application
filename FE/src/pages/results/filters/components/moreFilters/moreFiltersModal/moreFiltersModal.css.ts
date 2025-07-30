import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    primaryBackgroundColorOne,
    quaternaryBackgroundColorOne
} from "../../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    mainDiv: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: primaryBackgroundColorOne,
        borderRadius: 10,
        padding: 20,
        boxSizing: "border-box",
        justifyContent: "space-between",
    },
    closeIcon: {
        background: "transparent",
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: secondaryBackgroundColorOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    innerDiv: {
        height: 'calc(100% - 50px)',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        display: "flex",
        flexDirection: "column",
        gap: 20,
    },
    applyButton: ({accessibilityActive}: IProps) => ({
        background: primaryTextColorTwo,
        color: primaryBackgroundColorOne,
        fontWeight: 700,
        borderRadius: 15,
        height: 30,
        fontSize: accessibilityActive ? 20 : 16,
        border: 'none',
        cursor: 'pointer',
        '&:hover': {
            background: quaternaryBackgroundColorOne,
        }
    })
});
