import {createUseStyles} from 'react-jss';
import {secondaryBackgroundColorTwo, primaryTextColorTwo, primaryTextColorThree} from "../../../../../services/theme";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

const rootBaseStyles = {
    width: '100%',

    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryTextColorThree,
    borderRadius: '8px',
    border: `1px dotted ${primaryTextColorThree}`,
}

const textBaseStyles = (accessibilityActive:boolean) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height:20,
    fontSize: accessibilityActive ? 20 : 16,
    fontWeight:500,
    border: `1px solid ${primaryTextColorThree}`,
    backgroundColor:secondaryBackgroundColorTwo,
    padding:'10px',
    borderRadius: '20px',
})

export default createUseStyles({
    root:({isMobile}: IProps) => {
        if(!isMobile) return ({
       ...rootBaseStyles,
        height:120,
    })
    return ({
        ...rootBaseStyles,
        width: 'fit-content',
        height: '0',

    })
    },
    icon: {
        opacity: 0.9,
        borderRadius: '8px',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        '&:hover': {
            cursor: 'pointer',
            opacity: 1,
        }
    },
    text: ({isMobile, accessibilityActive}: IProps) => {
        if(!isMobile) return ({
            ...textBaseStyles(accessibilityActive),
            gap:5,
            color:primaryTextColorTwo,
        })
        return({
            display:'none'
        })
    },
    innerIcon:{
        height:18,
        width:18
    }
});
