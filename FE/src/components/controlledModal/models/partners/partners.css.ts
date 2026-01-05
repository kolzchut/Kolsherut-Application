import {createUseStyles} from 'react-jss';
import {getModalRootStyle, modalCloseIconStyle} from "../../utils/commonModalStyles";

interface IProps {
    isMobile: boolean,
    accessibilityActive: boolean
}

export default createUseStyles({
    root: ({isMobile}: IProps) => getModalRootStyle({isMobile}),
    closeIcon: modalCloseIconStyle,
    text: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 300
    })
});
