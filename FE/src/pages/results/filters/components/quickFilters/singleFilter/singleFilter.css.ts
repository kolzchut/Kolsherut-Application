import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne} from "../../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    optionDiv:{
      height:35,
        display: 'flex',
        flexDirection:'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        textDecoration: 'none',
        borderRadius: 3,
        '&:hover':{
        backgroundColor: secondaryBackgroundColorOne
        }
    },
    optionText: ({accessibilityActive}: IProps) => ({
        color: primaryTextColorTwo,
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 400,
        lineHeight: 1.2
    }),
    optionValue: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 300,
        lineHeight: 1,
        color: primaryTextColorTwo,
        borderRadius: 12,
        background: secondaryBackgroundColorOne,
        padding:'2px 6px',
        direction:'ltr'
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
    checkBox: {
        pointerEvents: 'none',
        height: '10px',
        width: '10px',
        margin: '0 4px',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        boxSizing: 'border-box',
        border: `4px solid ${secondaryBackgroundColorOne}`,
        outline: `1px solid ${primaryTextColorTwo}`,
        borderRadius: '15%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:checked': {
            backgroundColor: primaryTextColorTwo[500],
            borderColor: primaryTextColorTwo[500],
            border: `5px solid ${primaryTextColorTwo}`,
        },
    },
});
