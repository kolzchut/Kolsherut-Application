import pages, {Pages} from "./pages/pages";
import {useSelector, useDispatch} from "react-redux";
import {getModal, getPage} from "./store/general/general.selector";
import {useRouteUpdater} from "./services/url/route";
import ControlledModal from "./components/controlledModal/controlledModal";
import Sidebar from "./components/sidebar/sidebar";
import {useOnce} from "./hooks/useOnce";
import {setFirstVisitedUrl} from "./store/general/generalSlice";

function App() {
  useRouteUpdater();
  const page = useSelector(getPage) as Pages;
  const Page = pages[page];
  const modal = useSelector(getModal);
  const dispatch = useDispatch();

  const captureFirstUrl = useOnce(() => {
    dispatch(setFirstVisitedUrl(window.location.href));
  });
  captureFirstUrl();

  return <>
    <Page />
    {modal && <ControlledModal/>}
    <Sidebar/>
  </>
}

export default App;
