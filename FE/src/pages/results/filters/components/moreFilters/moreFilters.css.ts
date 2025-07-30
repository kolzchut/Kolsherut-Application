import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    primaryTextColorThree,
    secondaryBackgroundColorOne,
    primaryTextColorOne
} from "../../../../../services/theme";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

const baseButtonStyles = (accessibilityActive: boolean) => ({
    width: '100%',
    color: primaryTextColorTwo,
    fontSize: accessibilityActive ? 20 : 16,
    backgroundColor: 'transparent',
    '&:hover':{
        backgroundColor: secondaryBackgroundColorOne,
        cursor: 'pointer',
    }
})

export default createUseStyles({
    button:({isMobile, accessibilityActive}: IProps)=>{
        if(!isMobile)return{
            ...baseButtonStyles(accessibilityActive),
            height:40,
            borderRadius: 3,
            border: `1px solid ${primaryTextColorThree}`,
        }
        return {
            ...baseButtonStyles(accessibilityActive),
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
