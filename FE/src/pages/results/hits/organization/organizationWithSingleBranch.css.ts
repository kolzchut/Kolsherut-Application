import {createUseStyles} from 'react-jss';
import {tertiaryTextColorThree, tertiaryBackgroundColorTwo} from "../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    organization: {
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: tertiaryBackgroundColorTwo,
        boxSizing: 'border-box',
        padding: '12px',
        border: '1px solid #E1DEDB',
        borderTop: 0,
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        textDecoration: 'none',
        '&:hover': {
            cursor: 'pointer',
            boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        }
    },
    text: ({accessibilityActive}: IProps) => ({
        fontWeight: 300,
        fontSize: accessibilityActive ? 18 : 14,
        lineHeight: 1.3,
    }),
    nationalBranch: ({accessibilityActive}: IProps) => ({
        color: tertiaryTextColorThree,
        display: "flex",
        fontWeight: 300,
        fontSize: accessibilityActive ? 18 : 14,
        lineHeight: 1.3,
    }),
    nationalSpan: {
        display: 'ruby'
    }
});
