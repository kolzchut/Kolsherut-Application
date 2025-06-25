import {createUseStyles} from 'react-jss';
import {darkGrayOne, lightYellow} from "../../../../../services/theme";

export default createUseStyles({
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: '21px',
        fontSize:16
    },
    mainDiv:{
        width: '100%',
        padding: '25px 70px',
        boxSizing: 'border-box',
        backgroundColor: lightYellow,
        boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap:'20px',
    }
});
