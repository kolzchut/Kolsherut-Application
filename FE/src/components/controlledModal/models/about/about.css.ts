import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorTwo,
} from "../../../../services/theme";
import {
    getModalRootStyle,
    modalCloseIconStyle,
    modalTitleStyle,
    modalSubtitleStyle
} from "../../utils/commonModalStyles";

export default createUseStyles({
    root: ({isMobile}: { isMobile: boolean, accessibilityActive: boolean }) => getModalRootStyle({isMobile}, 'fit-content'),
    closeIcon: modalCloseIconStyle,
    header: {
        marginBottom: 20
    },
    title: modalTitleStyle,
    subtitle: modalSubtitleStyle,
    boldStartText: ({accessibilityActive}: { accessibilityActive: boolean }) => ({
        fontWeight: 700,
        fontSize: accessibilityActive ? 22 : 18
    }),
    inlineParagraph: ({accessibilityActive}: { accessibilityActive: boolean }) => ({
        display: 'inline',
        fontSize: accessibilityActive ? 22 : 18
    }),
    paragraph: ({accessibilityActive}: { accessibilityActive: boolean }) => ({
        display: 'inline-block',
        margin: '5px 0',
        lineHeight: 1.6,
        alignItems: 'center',
        fontSize: accessibilityActive ? 22 : 18,
    }),
    blackRegularLink: {
        fontWeight: 500,
        color: secondaryTextColorTwo,
    },
    links: {
        display: 'flex',
        flexDirection: 'column',
    }
});
