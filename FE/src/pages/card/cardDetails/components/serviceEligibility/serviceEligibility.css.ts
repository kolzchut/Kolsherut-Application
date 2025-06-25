import {createUseStyles} from 'react-jss';
import {darkGrayOne} from "../../../../../services/theme";

export default createUseStyles({
    paragraphText: {
        fontWeight: 300,
        fontSize:16,
        lineHeight: 1.3,
    },
    title: {
        color: darkGrayOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize:16
    },
});
