import {createUseStyles} from 'react-jss';
import {lightBlue, lightBlueOne} from "../../../../../../services/theme";

export default createUseStyles({
    optionDiv:{
      height:30,
        display: 'flex',
        flexDirection:'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 3,
        '&:hover':{
        backgroundColor: lightBlueOne
        }
    },
    optionText:{
        color: lightBlue,
        fontSize: 18,
        fontWeight: 400,
        lineHeight: 1.2
    },
    optionValue:{
        fontSize: 16,
        fontWeight: 300,
        lineHeight: 1,
        color: lightBlue,
        borderRadius: 12,
        background: lightBlueOne,
        padding:'2px 6px',
    },
    checkBox: {
        height: '100%' ,
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        boxSizing: 'border-box',
        border: `4px solid ${lightBlueOne}`,
        outline: `1px solid ${lightBlue}`,
        borderRadius: '50%',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:checked': {
            backgroundColor: lightBlue[500],
            borderColor: lightBlue[500],
            border: `4px solid ${lightBlue}`,
        },
    },
});
