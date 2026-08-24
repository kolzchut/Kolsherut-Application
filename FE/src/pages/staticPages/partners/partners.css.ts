import {createUseStyles} from 'react-jss';
import {pageRootStyle, pageTitleStyle} from "../utils/staticPageStyles";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    root: pageRootStyle,
    title: pageTitleStyle,
    text: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 300
    })
});
