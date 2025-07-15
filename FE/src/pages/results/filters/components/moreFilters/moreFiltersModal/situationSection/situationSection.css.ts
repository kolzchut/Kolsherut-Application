import {createUseStyles} from 'react-jss';
import {
    blackOne,
    darkGrayOne,
    lightBlue,
    lightBlueOne,
    lightGray, lightGrayOne,
    lightYellow
} from "../../../../../../../services/theme";

export default createUseStyles({
    mainDiv:{
        width:"100%",
        height:"fit-content",
        padding: 20,
        gap:8,
        boxSizing: "border-box",
        display:"flex",
        flexDirection:"column",
        direction:'rtl',
        borderTop: `1px solid ${lightGrayOne}`,
    },
    titleDiv:{
      width:"100%",
      display:"flex",
        justifyContent:"space-between",
        flexDirection:"row",
    },
    title:{
        fontWeight:600,
        lineHeight:1.3,
        fontSize:16,
        color:blackOne
    },
    cleanup:{
        fontWeight:400,
        lineHeight:1.3,
        fontSize:13,
        color: lightGray,
        '&:hover': {
            color:darkGrayOne,
            cursor: 'pointer',
            textDecoration: 'underline',
        }
    },
    label:{
        fontSize:16,
        width:'fit-content',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        fontWeight:400,
        backgroundColor: lightYellow,
        height:24,
        borderRadius: 3,
        padding: 6,
        boxSizing: 'border-box',
        color: blackOne,
        border: `1px solid ${lightGrayOne}`,
        '&:hover': {
            borderColor: lightGray,
            cursor: 'pointer',
        }
    },
    visuallyHidden: {
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
    },
    labelContainer:{
        width: '100%',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
    },
    checkBox:{
        accentColor:'black'
    },
    showMore:{
        height:24,
        display: 'flex',
        justifyContent:'center',
        alignItems: 'center',
        borderRadius: 3,
        padding: 6,
        boxSizing: 'border-box',
        backgroundColor: lightBlueOne,
        color: lightBlue,
        border: `1px solid ${lightBlue}`,
        '&:hover': {
            cursor: 'pointer',
        }
    }
});
