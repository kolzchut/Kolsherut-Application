import {createUseStyles} from 'react-jss';
import {tertiaryTextColorTwo, primaryBorderColorOne, primaryBackgroundColorOne} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default createUseStyles({
    aTag:{
        width: '100%',
        border: `1px solid ${primaryBorderColorOne}`,
        textDecoration: 'none',
        height: '48px',
        background:primaryBackgroundColorOne,
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: "center",
        gap: '4px'
    },
    title: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        fontWeight: 300,
        lineHeight: 1,
        color: tertiaryTextColorTwo
    })
});
