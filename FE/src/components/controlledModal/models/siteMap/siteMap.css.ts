import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorOne
} from "../../../../services/theme";
import {getModalRootStyle, modalCloseIconStyle} from "../../utils/commonModalStyles";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({isMobile}:IProps)=> getModalRootStyle({isMobile}),
    closeIcon: modalCloseIconStyle,
    text: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 300,
        color: secondaryTextColorOne,
        textDecoration: 'none',
        display: 'block',
        marginBottom: '8px',
        '&:hover': {
            textDecoration: 'underline'
        }
    }),
    mapDiv:{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        marginTop: 20,
        padding: 0,
        listStyleType: 'none',
    }
});
