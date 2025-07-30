import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorTwo,
    tertiaryTextColorOne,
    primaryTextColorTwo,
    secondaryBackgroundColorOne,
    tertiaryTextColorThree, primaryBorderColorTwo,
    tertiaryBackgroundColorTwo
} from "../../../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

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
        borderTop: `1px solid ${primaryBorderColorTwo}`,
    },
    titleDiv:{
      width:"100%",
      display:"flex",
        justifyContent:"space-between",
        flexDirection:"row",
    },
    title: ({accessibilityActive}: IProps) => ({
        fontWeight:600,
        lineHeight:1.3,
        fontSize: accessibilityActive ? 20 : 16,
        color:secondaryTextColorTwo
    }),
    cleanup: ({accessibilityActive}: IProps) => ({
        fontWeight:400,
        lineHeight:1.3,
        fontSize: accessibilityActive ? 18 : 13,
        color: tertiaryTextColorThree,
        '&:hover': {
            color:tertiaryTextColorOne,
            cursor: 'pointer',
            textDecoration: 'underline',
        }
    }),
    label: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        width:'fit-content',
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        fontWeight:400,
        backgroundColor: tertiaryBackgroundColorTwo,
        height:24,
        borderRadius: 3,
        padding: 6,
        boxSizing: 'border-box',
        color: secondaryTextColorTwo,
        border: `1px solid ${primaryBorderColorTwo}`,
        '&:hover': {
            borderColor: tertiaryTextColorThree,
            cursor: 'pointer',
        }
    }),
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
        backgroundColor: secondaryBackgroundColorOne,
        color: primaryTextColorTwo,
        border: `1px solid ${primaryTextColorTwo}`,
        '&:hover': {
            cursor: 'pointer',
        }
    }
});
