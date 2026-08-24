import {createUseStyles} from 'react-jss';
import {tertiaryTextColorOne} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    linkList:{
        display: 'flex',
        flexWrap: 'wrap',
    },
    title: ({accessibilityActive}: IProps) => ({
        color: tertiaryTextColorOne,
        fontWeight:600,
        lineHeight: 1.3,
        fontSize: accessibilityActive ? 20 : 16,
        margin: 0,
    }),
    link:{
        textDecoration:'none'
    }
});
