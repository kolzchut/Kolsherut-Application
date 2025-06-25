import {createUseStyles} from 'react-jss';
import {lightBlue} from "../../../services/theme";

export default createUseStyles({
    mainDiv: {
        width: '100%',
        display: 'flex',
        padding: '0 70px 70px 70px',
        gap: '16PX 32px',
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    links: {
        textDecoration: 'none',
        color: lightBlue,
        lineHeight: '20px',
        fontSize: '16px',
        fontWeight: 300,
        '&:hover': {
            textDecoration: 'underline',
        }
    }
});
