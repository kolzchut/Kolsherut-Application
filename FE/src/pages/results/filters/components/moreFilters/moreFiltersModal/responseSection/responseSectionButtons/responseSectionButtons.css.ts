import {createUseStyles} from 'react-jss';

export default createUseStyles({
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: 'center',
        margin: 8,
        '&:hover': {
            cursor: 'pointer',
        }
    },
    label: ({color, isSelected}: { color: string, isSelected: boolean}) => {
        const backgroundColor = `${color}10`;
        const borderColor = `${color}80`;
        const selectOrHoverBackgroundColor = `${color}30`;
        const selectOrHoverBorderColor = `${color}90`;
        return ({
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            backgroundColor:isSelected? selectOrHoverBackgroundColor :backgroundColor,
            textDecoration: 'none',
            padding: '4px 8px 4px 0px',
            border: isSelected ? `1px solid ${selectOrHoverBorderColor}` : `1px solid ${borderColor}`,
            borderRadius: 4,
            width: 'fit-content',
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            '&:hover': {
                backgroundColor: selectOrHoverBackgroundColor,
                borderColor: selectOrHoverBorderColor,
            }
        })
    },
    dot: ({color}: { color: string }) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        display: 'inline-block',
    }),
    cancelOrAdd: ({isSelected}: {color:string, isSelected:boolean})=>({
        width: 14,
        height: 14,
        marginLeft: 4,
        filter:  'brightness(50%) saturate(100%)',
        transform: isSelected ? 'rotate(0deg)' : 'rotate(45deg)',
        transition: 'transform 0.2s ease',
    }),
});
