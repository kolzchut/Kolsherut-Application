import {createUseStyles} from 'react-jss';
import {secondaryTextColorOne, tertiaryBackgroundColorOne, secondaryBackgroundColorOne} from "../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({accessibilityActive}: IProps) => ({
        width:'fit-content',
        height:'fit-content',
        fontSize: accessibilityActive ? '22px' : '18px',
        gap: 3,
        color:secondaryTextColorOne,
        fontWeight: 300,
        padding: 3,
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius:3,
        textDecoration:'none',
        '&:hover': {
            textDecoration: 'underline',
            cursor: 'pointer',
            fontWeight: 500,
        }
    }),
    icon:{
        height:'18px'
    },
    justiceLink:{
        background: secondaryBackgroundColorOne,
    },
    digitalLink:{
        background: secondaryBackgroundColorOne,
    },
    kzLink:{
        background:tertiaryBackgroundColorOne,
    }
});
