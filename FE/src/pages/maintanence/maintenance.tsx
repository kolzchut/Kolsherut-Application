import useStyle from "./maintenance.css";
import maintenance from "../../assets/maintenance.png";
import {useEffect} from "react";

const Maintenance = () => {
    const classes = useStyle();
    const home = location.protocol + '//' + location.host;
    useEffect(() => {
        setTimeout(()=>window.location.replace(home),5000);
    }, []);
    return <div className={classes.root}>
        <img src={maintenance} alt={'the page currently in maintenance'}/>
    </div>
}

export default Maintenance;
