import {createUseStyles} from 'react-jss';

export default createUseStyles({
    container:{
      display:"flex",
        flexDirection: "row",
        alignItems:'center',
        margin: 8
    },
    label: ({color}: { color: string; isResponse: boolean }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: `${color}10`, // 6.75% opacity (hex alpha)
        textDecoration: 'none',
        padding: '4px 8px',
        border: `1px solid ${color}80`, // 50% opacity (hex alpha)
        borderRadius: 4,
        width: 'fit-content',
        margin: 0,
        fontSize: 14,
        '&:hover': {
            backgroundColor: `${color}30`, // 18.75% opacity (hex alpha)
            borderColor: `${color}90`, // 56.25% opacity (hex alpha)
        }
    }),
    dot: ({color}: { color: string }) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        display: 'inline-block',
    }),
    linkIcon: ({isResponse}: {color: string; isResponse: boolean}) => ({
        width: 14,
        height: 14,
        marginLeft: 4,
        filter: isResponse ? 'brightness(50%) saturate(100%)' : 'none',
    }),
    situationLinkIcon: {
        width: 16,
        height: 16,
    },
    extra:({color}: {color: string; isResponse: boolean}) => ({
        backgroundColor: `${color}10`,
        borderTop: `1px solid ${color}80`,
        borderLeft: `1px solid ${color}80`,
        borderBottom: `1px solid ${color}80`,
        padding: '4px 2px',
        fontSize:14,
        borderRadius: '4px 0px 0px 4px',
    })
});
