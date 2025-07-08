import {createUseStyles} from 'react-jss';

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        justifyContent: 'space-between',
        '@media (max-width: 768px)': {
            flexDirection: 'column',
            height: '100%',
            width: '100%',
        }
    },
    main: {
        display: 'flex',
        flexDirection: 'column',
        flex: 6,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        direction: 'rtl',
    },
    mapContainer: {
        width: '50%',
        height: '100vh',
        flex: 3,
        '@media (max-width: 768px)': {
            width: '100%',
            height: '32vh',
            flex:'none',
        }
    }
});
