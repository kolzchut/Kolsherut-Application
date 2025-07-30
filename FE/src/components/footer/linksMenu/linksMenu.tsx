import useStyles from './linksMenu.css';
import {useEffect, useState} from "react";
import axios from "axios";
import logger from "../../../services/logger/logger";
import {useDispatch, useSelector} from "react-redux";
import {setModal} from "../../../store/general/generalSlice";
import {isAccessibilityActive} from "../../../store/general/general.selector.ts";

interface ILinks {
    title: string,
    url?: string,
    modal?: string
}

const LinksMenu = () => {
    const [links, setLinks] = useState<Array<ILinks>>([])
    const dispatch = useDispatch();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const classes = useStyles({accessibilityActive});

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
    const onClick = (e: React.MouseEvent<HTMLAnchorElement>, link: ILinks) => {
        if (link.url || !link.modal) return;
        e.preventDefault();
        dispatch(setModal(link.modal));
    }
    if (links.length === 0) return <></>;
    return <div className={classes.mainDiv}>
        {links.map((link: ILinks) => (
            <a className={classes.links} key={link.title} target={'_blank'} href={link.url}
               onClick={(e: React.MouseEvent<HTMLAnchorElement>) => onClick(e, link)}>{link.title}</a>
        ))}
    </div>
}

export default LinksMenu;
