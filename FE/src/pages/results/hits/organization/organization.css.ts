import {createUseStyles} from 'react-jss';
import {tertiaryBackgroundColorThree, primaryTextColorTwo, tertiaryTextColorThree, tertiaryBackgroundColorTwo} from "../../../../services/theme";

interface IProps {
    isSelected: boolean,
    accessibilityActive: boolean
}

const textStyle = {
    fontWeight: 400,
    color: primaryTextColorTwo,
    textAlign: 'right'
};

export default createUseStyles({
    organization: ({isSelected}: IProps) => ({
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: isSelected ? tertiaryBackgroundColorThree : tertiaryBackgroundColorTwo,
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
    }),
    organizationName:({accessibilityActive}: IProps) => ({
        ...textStyle,
        fontSize: accessibilityActive ? 22 : 18,
        width:'30%',
    }),
    numOfBranches: ({accessibilityActive}: IProps) => ({
        ...textStyle,
        fontSize: accessibilityActive ? 18 : 14,
        fontWeight: 300,
    }),
    nationalBranch:{
        color: tertiaryTextColorThree,
        display:"flex"
    },
    nationalSpan:{
        display:'ruby'
    }
});
