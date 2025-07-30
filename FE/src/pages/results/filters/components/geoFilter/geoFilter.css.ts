import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        padding: 10,
        height: 40,
        boxSizing: 'border-box',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        borderRadius: 20,
        direction: "rtl",
        background: "#0000000A",
        border: `1px solid ${primaryTextColorTwo}`,
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        '&:hover': {
            background: "#FFFFFFFF",
            cursor: 'pointer',
            boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.2)',
        }
    },
    textAndMapDiv: ({accessibilityActive}: IProps) => ({
        display: 'flex',
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 700,
        color: primaryTextColorTwo,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center'
    }),
    count: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 700,
        lineHeight: 1,
        color: primaryTextColorTwo,
        borderRadius: 12,
        background: secondaryBackgroundColorOne,
        padding: '2px 6px',
    }),
});
