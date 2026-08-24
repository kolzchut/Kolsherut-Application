import {createUseStyles} from 'react-jss';
import {secondaryTextColorTwo} from "../../../services/theme";
import {pageRootStyle, pageSubtitleStyle, pageTitleStyle} from "../utils/staticPageStyles";

export default createUseStyles({
    root: pageRootStyle,
    header: {
        marginBottom: 20
    },
    title: pageTitleStyle,
    subtitle: pageSubtitleStyle,
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
