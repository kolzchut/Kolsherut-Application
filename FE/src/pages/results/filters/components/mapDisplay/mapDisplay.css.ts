import {createUseStyles} from 'react-jss';
import {brightBlueOne, lightBlue, royalBlue} from "../../../../../services/theme";
const rootBaseStyles = {
    width: '100%',

    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: royalBlue,
    borderRadius: '8px',
    border: `1px dotted ${royalBlue}`,
}
const textBaseStyles = {
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height:20,
    fontSize:16,
    fontWeight:500,
    border: `1px solid ${royalBlue}`,
    backgroundColor:brightBlueOne,
    padding:'10px',
    borderRadius: '20px',
}
export default createUseStyles({
    root:({isMobile}: { isMobile: boolean }) => {
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
    text:({isMobile}: { isMobile: boolean }) => {
        if(!isMobile)return ({
            ...textBaseStyles,
            color: royalBlue,
            gap:'5px',
        })
        return ({
            ...textBaseStyles,
            color: lightBlue,

        })
    },
    innerIcon:{
        height: '100%'
    }
});
