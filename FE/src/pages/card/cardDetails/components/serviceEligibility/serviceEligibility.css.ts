import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    paragraphText: ({accessibilityActive}: IProps) => ({
        fontWeight: 300,
        fontSize: accessibilityActive ? 20 : 16,
        lineHeight: 1.3,
    }),
    title: ({accessibilityActive}: IProps) => ({
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 20 : 16
    }),
});
