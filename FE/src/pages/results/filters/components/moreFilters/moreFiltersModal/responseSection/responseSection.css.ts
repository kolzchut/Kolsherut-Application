import {createUseStyles} from 'react-jss';
import {darkGrayTwo} from "../../../../../../../services/theme";

export default createUseStyles({
    mainDiv:{
        display:"flex",
        flexDirection:"column",
        width:"100%",
        direction: 'rtl'
    },
    responseOptionsContainer:{
        display:"flex",
        flexWrap:"wrap",
        flexDirection:"column",
    },
    sectionDiv:{
        display:"flex",
        width:'fit-content',
        flexDirection:'row',
        flexWrap:'wrap',
    },
    title:{
        fontWeight:600,
        lineHeight:1.3,
        fontSize:18,
        color: darkGrayTwo,
        '&:hover': {
            cursor: 'pointer',
            textDecoration: 'underline',
        }
    }
});
