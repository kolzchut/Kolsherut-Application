import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, tertiaryBackgroundColorTwo} from "../../../../services/theme";

export default createUseStyles({
    root: {
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: primaryTextColorTwo,
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
    }
});
