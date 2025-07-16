import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne} from "../../../../../../services/theme";

export default createUseStyles({
    optionDiv:{
      height:30,
        display: 'flex',
        flexDirection:'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 3,
        '&:hover':{
        backgroundColor: secondaryBackgroundColorOne
        }
    },
    optionText:{
        color: primaryTextColorTwo,
        fontSize: 18,
        fontWeight: 400,
        lineHeight: 1.2
    },
    optionValue:{
        fontSize: 16,
        fontWeight: 300,
        lineHeight: 1,
        color: primaryTextColorTwo,
        borderRadius: 12,
        background: secondaryBackgroundColorOne,
        padding:'2px 6px',
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
    checkBox: {
        height: '100%' ,
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        boxSizing: 'border-box',
        border: `4px solid ${secondaryBackgroundColorOne}`,
        outline: `1px solid ${primaryTextColorTwo}`,
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:checked': {
            backgroundColor: primaryTextColorTwo[500],
            borderColor: primaryTextColorTwo[500],
            border: `4px solid ${primaryTextColorTwo}`,
        },
    },
});
