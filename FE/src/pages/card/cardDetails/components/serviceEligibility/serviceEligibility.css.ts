import {createUseStyles} from 'react-jss';
import {darkGrayOne} from "../../../../../services/theme";

export default createUseStyles({
    paragraphText: {
        fontWeight: 300,
        fontSize:16,
        lineHeight: '21px',
    },
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: '21px',
        fontSize:16
    },
});
