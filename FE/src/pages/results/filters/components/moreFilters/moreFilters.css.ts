import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    primaryTextColorThree,
    secondaryBackgroundColorOne,
    primaryTextColorOne
} from "../../../../../services/theme";

const baseButtonStyles = {
    width: '100%',
    color: primaryTextColorTwo,
    fontSize: 16,
    backgroundColor: 'transparent',
    '&:hover':{
        backgroundColor: secondaryBackgroundColorOne,
        cursor: 'pointer',
    }
}

export default createUseStyles({
    button:({isMobile}: {isMobile:boolean})=>{
        if(!isMobile)return{
            ...baseButtonStyles,
            height:40,
            borderRadius: 3,
            border: `1px solid ${primaryTextColorThree}`,

        }
        return {
            ...baseButtonStyles,
            borderRadius:3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            width: 'fit-content',
            border: `1px solid ${primaryTextColorOne}`,

        }
    }
});
