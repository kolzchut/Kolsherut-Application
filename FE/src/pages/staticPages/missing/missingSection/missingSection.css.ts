import {createUseStyles} from 'react-jss';
import {
    secondaryTextColorOne,
    primaryTextColorOne,
    primaryBackgroundColorOne
} from "../../../../services/theme";

interface IProps {
    accessibilityActive: boolean;
}

export default createUseStyles({
    root: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: '10px',
        boxSizing: 'border-box',
        backgroundColor: primaryBackgroundColorOne,
        borderRadius: 10,
        border: `1px solid ${primaryTextColorOne}40`,
    },
    openDiv: {
        marginTop: 10,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        gap: 4,
    },
    title: ({accessibilityActive}: IProps) => ({
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 24 : 20,
        margin: 0,
        color: primaryTextColorOne,
    }),
    subtitle: ({accessibilityActive}: IProps) => ({
        fontWeight: 600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 22 : 18,
        margin: 0,
        color: secondaryTextColorOne
    }),
    paragraph: ({accessibilityActive}: IProps) => ({
        fontWeight: 300,
        lineHeight: 1.6,
        fontSize: accessibilityActive ? 20 : 16,
        margin: 0,
        color: secondaryTextColorOne
    }),
    link: ({accessibilityActive}: IProps) => ({
        display: 'flex',
        width: 'fit-content',
        fontSize: accessibilityActive ? 20 : 16,
        '&:hover': {
            cursor: 'pointer'
        }
    })
});
