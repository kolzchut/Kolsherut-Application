import {createUseStyles} from 'react-jss';
import {
    primaryTextColorTwo,
    primaryBackgroundColorOne
} from "../../../services/theme";
import {pageRootStyle, pageSubtitleStyle, pageTitleStyle} from "../utils/staticPageStyles";

export default createUseStyles({
    root: pageRootStyle,
    header: {
        marginBottom: 20
    },
    title: pageTitleStyle,
    subtitle: pageSubtitleStyle,
    sectionWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    button: ({accessibilityActive}: { accessibilityActive: boolean }) => ({
        width: '100%',
        fontSize: accessibilityActive ? '20px' : '16px',
        height: '40px',
        borderRadius: '20px',
        border: 'none',
        background: primaryTextColorTwo,
        color: primaryBackgroundColorOne,
        '&:hover': {
            cursor: 'pointer',
        }
    })
});
