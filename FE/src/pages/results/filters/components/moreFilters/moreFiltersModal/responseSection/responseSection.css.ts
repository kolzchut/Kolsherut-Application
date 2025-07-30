import {createUseStyles} from 'react-jss';
import {tertiaryTextColorTwo} from "../../../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

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
    title: ({accessibilityActive}: IProps) => ({
        fontWeight:600,
        lineHeight:1.3,
        fontSize: accessibilityActive ? 22 : 18,
        color: tertiaryTextColorTwo,
        '&:hover': {
            cursor: 'pointer',
            textDecoration: 'underline',
        }
    })
});
