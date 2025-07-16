import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, primaryTextColorThree, secondaryBackgroundColorOne} from "../../../../../services/theme";

const baseButtonStyles = {
    width: '100%',
    height:40,
    color: primaryTextColorTwo,
    fontSize: 16,
    backgroundColor: 'transparent',
    border: `1px solid ${primaryTextColorThree}`,
    '&:hover':{
        backgroundColor: secondaryBackgroundColorOne,
        cursor: 'pointer',
    }
}

export default createUseStyles({
    button:({isMobile}: {isMobile:boolean})=>{
        if(!isMobile)return{
            ...baseButtonStyles,
            borderRadius: 3,
        }
        return {
            ...baseButtonStyles,
            borderRadius:20,
            padding: '0 10px',
            width: 'fit-content',
        }
    }
});
