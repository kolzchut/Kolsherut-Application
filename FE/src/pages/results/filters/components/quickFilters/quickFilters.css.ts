import {createUseStyles} from 'react-jss';
import {secondaryTextColorTwo} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    headerText: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 17 : 13,
        fontWeight: 600,
        lineHeight: 1.2,
        color: secondaryTextColorTwo,
    }),
});
