import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne} from "../../../../../services/theme";

export default createUseStyles({
    linkList:{
        display: 'flex',
        flexWrap: 'wrap',
    },
    title: {
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize:16
    },
    link:{
        textDecoration:'none'
    }
});
