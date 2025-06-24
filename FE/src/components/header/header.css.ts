import {createUseStyles} from 'react-jss';

export default  createUseStyles({
    root:{
        display: 'flex',
        backgroundColor: 'white',
        width: '100%',
        height: 200,
        color: '#1f37f6',
        justifyContent: 'space-around',
    },
    links:{
        width: "100%",
        display: "flex",
        justifyContent: "space-around",
        lineHeight: 4,
        fontSize: 20
    }
});
