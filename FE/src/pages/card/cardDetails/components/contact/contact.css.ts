import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    title: ({accessibilityActive}: IProps) => ({
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 20 : 16
    }),
});
