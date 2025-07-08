import useStyle from "./maintenance.css";
import maintenance from "../../assets/maintenance.png";

const Maintenance = () => {
    const classes = useStyle();
    const home = location.protocol + '//' + location.host;
    setTimeout(()=>window.location.replace(home),2000);
    return <div className={classes.root}>
        <img src={maintenance} alt={'the page currently in maintenance'}/>
    </div>
}

export default Maintenance;
