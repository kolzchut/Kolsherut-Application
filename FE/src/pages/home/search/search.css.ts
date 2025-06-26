import { createUseStyles } from 'react-jss';
import homepageBackground from '../../../assets/homepage-background.png';
import {gray, royalBlue, white} from "../../../services/theme";
export default createUseStyles({
    root: {
        backgroundColor: '#8296AE',
        backgroundImage: `url(${homepageBackground})`,
        height: '100%',
        flex: 4,
        fontSize: 24,
        maxWidth: 750,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        position: 'relative',
        width: '70%',
        marginBottom:20
    },
    searchInput: {
        width: '70%',
        padding: '10px 80px 10px 15px',
        border: `1px solid ${royalBlue}`,
        borderRadius: 20,
        fontSize: 24,
        direction: 'rtl',
        backgroundColor: white,
        '&:focus': {
            outline: '2px solid royalblue',
        },
        '&:hover': {
            outline: '2px solid royalblue',
        },
        '&::placeholder': {
            color: royalBlue,
        },
    },
    searchButton: {
        position: 'absolute',
        top: '50%',
        right: 30,
        transform: 'translateY(-50%)',
        color: white,
        border: 'none',
        padding: '5px 10px',
        borderRadius: 10,
    },
    optionalSearchValuesWrapper:{
        width:'70%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 10,
        backgroundColor:white,
    },
    optionalSearchValue:{
        borderBottom: `1px dotted ${gray}`,
        lineHeight: 2,
        width:'100%',
        display: 'flex',
        flexDirection: "row",
        justifyContent: 'space-between',
        direction: 'rtl',
        alignItems: 'center',
        cursor: 'pointer',
    },
    searchIcon:{
        height: '30px'
    },
    iconAndText:{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingRight: 10,
    }
});
