import pages, {Pages} from "./pages/pages";
import {useSelector, useDispatch} from "react-redux";
import {getModal, getPage, isAccessibilityActive} from "./store/general/general.selector";
import {useRouteUpdater} from "./services/url/route";
import ControlledModal from "./components/controlledModal/controlledModal";
import Sidebar from "./components/sidebar/sidebar";
import {useOnce} from "./hooks/useOnce";
import {setFirstVisitedUrl} from "./store/general/generalSlice";
import useHeaderStyle from "./components/header/headerAndSearchInput.css.ts";
import {isMobileScreen} from "./services/media";

function App() {
  useRouteUpdater();
  const accessibility = useSelector(isAccessibilityActive);
  const page = useSelector(getPage) as Pages;
  const Page = pages[page];
  const modal = useSelector(getModal);
  const dispatch = useDispatch();
  const isMobile = isMobileScreen();
  const headerStyle= useHeaderStyle({accessibilityActive:accessibility, isMobile});
  const captureFirstUrl = useOnce(() => {
    dispatch(setFirstVisitedUrl(window.location.href));
  });
  captureFirstUrl();

  return <>
    <Page {...{headerStyle}}/>
    {modal && <ControlledModal/>}
    <Sidebar/>
  </>
}

export default App;
