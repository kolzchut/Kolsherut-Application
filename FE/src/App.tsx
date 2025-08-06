import pages, {Pages} from "./pages/pages";
import {useSelector, useDispatch} from "react-redux";
import {getModal, getPage, isAccessibilityActive} from "./store/general/general.selector";
import {useRouteUpdater} from "./services/url/route";
import ControlledModal from "./components/controlledModal/controlledModal";
import Sidebar from "./components/sidebar/sidebar";
import {useOnce} from "./hooks/useOnce";
import {setFirstVisitedUrl} from "./store/general/generalSlice";
import {isMobileScreen} from "./services/media";
import {ThemeProvider} from 'react-jss';

function App() {
    useRouteUpdater();
    const accessibilityActive = useSelector(isAccessibilityActive);
    const page = useSelector(getPage) as Pages;
    const Page = pages[page];
    const modal = useSelector(getModal);
    const dispatch = useDispatch();
    const isMobile = isMobileScreen();
    const dynamicTheme = {
        isMobile,
        accessibilityActive
    };
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
