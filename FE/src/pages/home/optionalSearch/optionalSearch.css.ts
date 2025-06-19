import {createUseStyles} from 'react-jss';
import {Cyan, gray, royalBlue, white} from "../../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap:'wrap',
        fontFamily: 'RAG Sans, sans-serif',
        justifyContent: "center",
        alignItems: 'center',
        gap: 20,
        padding: 20,
        backgroundColor: white,
        borderRadius: 10,
    },
    group: {
        width: 250,
    },
    groupTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: royalBlue,
        marginBottom: 10,
        '&:hover': {
            backgroundColor: Cyan
        },
    },
    optionalSearchValuesWrapper: {
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        backgroundColor: white,
        borderRadius: 10,
        padding: 10,
        border: `1px solid ${gray}`,
    },
    optionalSearchValue: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: Cyan
        },
    },
    selected: {
        backgroundColor: Cyan
    },
    searchIcon: {
        width: 24,
        height: 24,
    },
});
