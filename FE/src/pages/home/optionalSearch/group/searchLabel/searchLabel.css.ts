import {createUseStyles} from 'react-jss';
import {primaryTextColorTwo, secondaryBackgroundColorOne, primaryBorderColorTwo, tertiaryBackgroundColorTwo} from "../../../../../services/theme";

interface IProps {
    accessibilityActive: boolean;
}

export default createUseStyles({
    optionalSearchValue: ({ accessibilityActive }: IProps) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "RAG SANS ,Arial, sans-serif",
        width: 'fit-content',
        textDecoration:"none",
        padding:8,
        border: `1px solid ${primaryBorderColorTwo}`,
        borderRadius: 4,
        background: tertiaryBackgroundColorTwo,
        cursor: 'pointer',
        color: primaryTextColorTwo,
        fontSize: accessibilityActive ? 22 : 18,
        fontWeight: 300,
        '&:hover': {
            cursor: 'pointer',
            background: secondaryBackgroundColorOne,
        }
    }),
});
