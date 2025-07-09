import {createUseStyles} from 'react-jss';
import {lightBlue, lightBlueOne, lightGrayOne, lightYellow, white} from "../../services/theme";

export default createUseStyles({
    root: {
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: 80,
        color: lightBlue,
        direction: 'rtl',
        alignItems: 'center',
        boxSizing: 'border-box',
        padding: '10px'
    },
    logo: {
        flex:1,
        height: 40,
    },
    inputDiv:{
        flex:14,
        position:'relative',
        display: 'flex',
        alignItems: 'center',
    },
    searchIcon:{
        position: 'absolute',
        left: 10,
    },
    input: () => {
        const firstBackground = lightYellow;
        const firstBorderColor = lightGrayOne;
        const secondBackground = lightBlueOne;
        const secondBorderColor = lightBlue + '42';
        return ({
            height: "100%",
            width: '100%',
            fontSize: '22px',
            boxSizing: 'border-box',
            padding: '10px',
            borderRadius: '5px',
            background: firstBackground,
            border: `2px solid ${firstBorderColor}`,
            '&:hover': {
                background: secondBackground,
                border: `2px solid ${secondBorderColor}`,
            },
            '&:focus': {
                background: secondBackground,
                border: `2px solid ${lightBlue}`,
                outline: 'none'
            }
        })
    },
    linksDiv: {
        background: white,
        flex:6,
        display: "flex",
        justifyContent: "space-around",
    },
    link:{
        lineHeight: 4,
        fontSize: 20,
        textDecoration: "none"
    }
});
