import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    primaryBackgroundColorOne
} from "../../../../services/theme";
import {
    getModalRootStyle,
    modalCloseIconStyle,
    modalTitleStyle,
    modalSubtitleStyle
} from "../../utils/commonModalStyles";

export default createUseStyles({
    root: ({isMobile}: { isMobile: boolean, accessibilityActive: boolean }) => getModalRootStyle({isMobile}),
    closeIcon: modalCloseIconStyle,
    header: {
        marginBottom: 20
    },
    title: modalTitleStyle,
    subtitle: modalSubtitleStyle,
    button: ({ accessibilityActive }: { accessibilityActive: boolean }) => ({
        width: '100%',
        fontSize: accessibilityActive ? '20px' : '16px',
        height: '40px',
        borderRadius: '20px',
        background: primaryTextColorTwo,
        color: primaryBackgroundColorOne,
        '&:hover': {
            cursor: 'pointer',
        }
    })
});
