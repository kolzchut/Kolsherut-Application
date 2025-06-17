import useStyle from "./header.css";
const Header = () => {
        const classes = useStyle();
        return <div className={classes.root}>
                <div className={classes.links}>
                        <a href="https://google.com">אודות</a>
                        <a href="https://google.com">הוספת שירות חסר</a>
                        <a href="https://google.com">שותפים</a>
                        <a href="https://google.com">צרו קשר</a>
                </div>
                <div></div>
        </div>
}

export default Header;
