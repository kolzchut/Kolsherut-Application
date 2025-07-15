import {createUseStyles} from 'react-jss';
import {lightBlueOne, white} from "../../../../services/theme";

export default createUseStyles({
    root: {
        position: 'relative',
        display: 'flex',
        gap: 10,
        flexDirection: 'column',
        width: '100%',
        heigh: 'fit-content',
        padding: '20px 40px',
        borderRadius: 8,
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        direction: 'rtl',
        background: white,
    },
    closeIcon: {
        background: "transparent",
        position: "absolute",
        top: 10,
        left: 10,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: 15,
        '&:hover': {
            background: lightBlueOne,
            transform: 'rotate(90deg)',
            transition: 'background 0.3s ease, transform 0.5s ease',
        }
    },
    text: {
        fontSize: 18,
        fontWeight: 300
    }
});

