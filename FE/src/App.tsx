import pages, {Pages} from "./pages/pages";
import {useSelector} from "react-redux";
import {getModal, getPage} from "./store/general/general.selector";
import {useRouteUpdater} from "./services/route";
import ControlledModal from "./components/controlledModal/controlledModal";
import Sidebar from "./components/sidebar/sidebar.tsx";

function App() {
  useRouteUpdater();
  const page = useSelector(getPage) as Pages;
  const Page = pages[page];
  const modal =useSelector(getModal);
  return <>
    <Page />
    {modal && <ControlledModal/>}
    <Sidebar/>
  </>
}

export default App;
