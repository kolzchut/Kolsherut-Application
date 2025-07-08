import {createUseStyles} from 'react-jss';
import {brightBlueOne, royalBlue} from "../../../../../services/theme";

export default createUseStyles({
    root: {
        width: '100%',
        height:120,
        boxSizing: 'border-box',
        display: 'flex',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: royalBlue,
        borderRadius: '8px',
        border: `1px dotted ${royalBlue}`,
    },
    icon: {
        opacity: 0.9,
        borderRadius: '8px',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        '&:hover': {
            cursor: 'pointer',
            opacity: 1,
        }
    },
    text:{
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height:20,
        fontSize:16,
        gap:'5px',
        fontWeight:500,
        border: `1px solid ${royalBlue}`,
        color: royalBlue,
        backgroundColor:brightBlueOne,
        padding:'10px',
        borderRadius: '20px',
    },
    innerIcon:{
        height: '100%'
    }
});
