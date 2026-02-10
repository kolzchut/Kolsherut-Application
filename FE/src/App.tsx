import pages, {Pages} from "./pages/pages";
import {useDispatch, useSelector} from "react-redux";
import {getModal, getPage, isAccessibilityActive} from "./store/general/general.selector";
import {useRouteUpdater} from "./services/url/route";
import ControlledModal from "./components/controlledModal/controlledModal";
import Sidebar from "./components/sidebar/sidebar";
import {isMobileScreen} from "./services/media";
import {ThemeProvider} from 'react-jss';
import {setFirstVisitedUrl, setModal} from "./store/general/generalSlice";
import {useEffect} from "react";
import {useOnce} from "./hooks/useOnce";

function App() {
    useRouteUpdater();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const page = useSelector(getPage) as Pages;
    const Page = pages[page];
    const modal = useSelector(getModal);
    const isMobile = isMobileScreen();
    const dynamicTheme = {
        isMobile,
        accessibilityActive
    };
    const dispatch = useDispatch()

    useEffect(() => {
        if (page === "sitemap") {
            dispatch(setModal("SiteMap"));
        }
    }, [page, dispatch]);

    const captureFirstUrl = useOnce(() => {
        dispatch(setFirstVisitedUrl(window.location.href));
    });
    captureFirstUrl();

    return <>
        <ThemeProvider theme={dynamicTheme}>
            <Page/>
            {modal && <ControlledModal/>}
            <Sidebar/>
        </ThemeProvider>
    </>
}


export default App;
