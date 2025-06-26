import {createUseStyles} from 'react-jss';
import {darkGrayOne} from "../../../../../services/theme";

export default createUseStyles({
    linkList:{
        display: 'flex',
        flexWrap: 'wrap',
    },
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize:16
    },
});
