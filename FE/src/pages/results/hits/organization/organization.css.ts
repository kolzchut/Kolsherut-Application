import {createUseStyles} from 'react-jss';
import {tertiaryBackgroundColorThree, primaryTextColorTwo, tertiaryTextColorThree, tertiaryBackgroundColorTwo} from "../../../../services/theme";

export default createUseStyles({
    organization:({isSelected}:{isSelected:boolean})=>({
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor:isSelected ? tertiaryBackgroundColorThree : tertiaryBackgroundColorTwo,
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
    text:({isSelected}:{isSelected:boolean})=>({
        fontWeight:isSelected? 700 : 300,
        fontSize: '16px',
        lineHeight: 1.3,
    }),
    numOfBranches:({isSelected}:{isSelected:boolean})=>({
        color: primaryTextColorTwo,
        textDecoration: isSelected ? 'underline' : 'none',
    }),
    nationalBranch:{
        color: tertiaryTextColorThree,
        display:"flex"
    },
    nationalSpan:{
        display:'ruby'
    }
});
