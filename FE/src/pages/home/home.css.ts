import {createUseStyles} from 'react-jss';

export default createUseStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        width: '100%',
        justifyContent: 'space-between',
    },
    main: {
        display: 'flex',
        flexDirection: 'column',
        flex: 6,
        overflowY: 'auto',
        scrollbarWidth: 'none',
    }
});
