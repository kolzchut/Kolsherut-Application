import {createUseStyles} from 'react-jss';
import {primaryBorderColorOne} from "../../../../../services/theme";

export default createUseStyles({
    optionalSearchValue: {
        borderBottom: `1px dotted ${primaryBorderColorOne}`,
        lineHeight: 1.1,
        padding: '10px 0',
        maxHeight: '50px',
        width: '100%',
        display: 'flex',
        flexDirection: "row",
        justifyContent: 'space-between',
        direction: 'rtl',
        alignItems: 'center',
        cursor: 'pointer',
    },
    searchIcon: {
        height: '30px',
        "@media (max-width: 768px)": {
            height: '20px',
        }
    },
    iconAndText: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingRight: 10,
        fontSize: 24,
        "@media (max-width: 768px)": {
            fontSize: 20,
        },
    }
});
