import {createUseStyles} from 'react-jss';

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        width: '100vh',
        justifyContent: 'space-between',
    },
    mapContainer:{
        width: '50%',
        height: '100%',
        minWidth: 500,
    }
});