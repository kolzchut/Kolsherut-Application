import {createUseStyles} from 'react-jss';
import {lightBlue, lightBlueOne} from "../../../../../services/theme";

const baseRootStyles = {
    display: 'flex',
    flexDirection: 'row',
    padding: 10,
    height: 40,
    boxSizing: 'border-box',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 20,
    direction: "rtl",
    background: "#0000000A",
    border: `1px solid ${lightBlue}`,
    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
    '&:hover': {
        background: "#FFFFFFFF",
        cursor: 'pointer',
        boxShadow: '0px 6px 8px rgba(0, 0, 0, 0.2)',
    }
}
export default createUseStyles({
    root:({isMobile}: { isMobile: boolean }) => {
        if(!isMobile) return {
            ...baseRootStyles,
            width: '100%',

        }
        return {
            ...baseRootStyles,
            width: 'fit-content',
            maxWidth: '43%'
        }
    },
    textAndMapDiv: {
        display: 'flex',
        fontSize: 16,
        fontWeight: 700,
        color: lightBlue,
        height: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        justifyContent: 'center'
    },
    count: {
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1,
        color: lightBlue,
        borderRadius: 12,
        background: lightBlueOne,
        padding: '2px 6px',
    },
});
