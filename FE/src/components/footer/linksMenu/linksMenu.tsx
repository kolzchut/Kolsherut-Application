import useStyles from './linksMenu.css';
import {useEffect, useState} from "react";
import axios from "axios";
import logger from "../../../services/logger/logger";
import {useDispatch} from "react-redux";
import {setModal} from "../../../store/general/generalSlice";

interface ILinks {
    title: string,
    url?: string,
    modal?: string
}

const LinksMenu = () => {
    const [links, setLinks] = useState<Array<ILinks>>([])
    const dispatch = useDispatch();
    useEffect(() => {
        const getLinks = async () => {
            try {
                const response = await axios.get(`/configs/linksBelow.json?cacheBuster=${Date.now()}`);
                setLinks(response.data);
            } catch (error) {
                logger.error({message: "Error fetching links below", payload: error});
            }
        }
        getLinks();
    }, []);
    const onClick = (link: ILinks) => {
        if (link.url || !link.modal) return true;
        dispatch(setModal(link.modal));
        return false
    }
    const classes = useStyles();
    if (links.length === 0) return <></>;
    return <div className={classes.mainDiv}>
        {links.map((link: ILinks) => (
            <a className={classes.links} key={link.title} target={'_blank'} href={link.url} onClick={() => onClick(link)}>{link.title}</a>
        ))}
    </div>
}

export default LinksMenu;
