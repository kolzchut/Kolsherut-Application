import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne, tertiaryBackgroundColorTwo} from "../../../../../services/theme";

export default createUseStyles({
    title: {
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.25,
        fontSize:16
    },
    aTag: {
        textDecoration: "none",
        '&:hover': {
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-2px)',
        },
    },
    mainDiv:{
        width: '100%',
        padding: '25px 70px',
        boxSizing: 'border-box',
        backgroundColor: tertiaryBackgroundColorTwo,
        boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap:'20px',
        '@media (max-width: 768px)': {
            padding: '24px 16px'
        }
    }
});
