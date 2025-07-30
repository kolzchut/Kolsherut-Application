import {createUseStyles} from 'react-jss';
import {secondaryTextColorTwo} from "../../services/theme";

interface IProps {
    accessibilityActive: boolean
}

export default  createUseStyles({
    disclaimer:{
        direction:'rtl',
        padding: "32px 56px",
        '@media (max-width: 768px)': {
            padding: '24px 16px'
        }
    },
    firstParagraph: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 20 : 16,
        lineHeight: 1.25,
        fontWeight: 300,
        color: secondaryTextColorTwo
    }),
    bolder:{
        fontWeight: 700
    },
    secondAndThirdParagraphs: ({accessibilityActive}: IProps) => ({
        fontSize: accessibilityActive ? 17 : 13,
        lineHeight: 1.25,
        fontWeight: 300,
        color: secondaryTextColorTwo
    }),
    icons:{
        height:13
    }
});
