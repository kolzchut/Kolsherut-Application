import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo} from "../../../services/theme";

export default createUseStyles({
    mainDiv: {
        width: '100%',
        display: 'flex',
        padding: '0 70px 20px 70px',
        gap: '16PX 32px',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
        '@media (max-width: 768px)': {
            padding: '24px 16px'
        }
    },
    links: {
        textDecoration: 'none',
        color: primaryTextColorTwo,
        lineHeight: 1.25,
        fontSize: '16px',
        fontWeight: 300,
        '&:hover': {
            textDecoration: 'underline',
        }
    }
});
