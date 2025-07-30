import {createUseStyles} from 'react-jss';
import {tertiaryTextColorThree} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    text: ({accessibilityActive}: IProps) => ({
        fontWeight: 400,
        fontSize: accessibilityActive ? 18 : 13,
        lineHeight: 1.3,
        color: tertiaryTextColorThree
    })
});
