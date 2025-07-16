import {createUseStyles} from 'react-jss';
import {lightBlue, lightBlueOne, lightGrayOne, lightYellow} from "../../../../../services/theme.ts";

export default createUseStyles({
    optionalSearchValue: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "RAG SANS ,Arial, sans-serif",
        width: 'fit-content',
        padding:8,
        border: `1px solid ${lightGrayOne}`,
        borderRadius: 4,
        background: lightYellow,
        cursor: 'pointer',
        color: lightBlue,
        fontSize: 18,
        fontWeight: 300,
        '&:hover': {
            cursor: 'pointer',
            background: lightBlueOne,
        }
    },
});
