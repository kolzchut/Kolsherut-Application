import useStyles from './linksMenu.css';

const LinksMenu = () => {
    const classes = useStyles();
    const linksRefs = window.config.redirects.linksMenu;
    const linksNames = window.strings.linksMenu;
    if (!linksRefs || !linksNames) return <></>;
    return <div className={classes.mainDiv}>
        {Object.keys(linksNames).map((key: string) => (
            <a className={classes.links} key={key} href={linksRefs[key]}>{linksNames[key]}</a>
        ))}
    </div>
}

export default LinksMenu;
