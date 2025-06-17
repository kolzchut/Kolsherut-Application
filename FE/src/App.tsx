import './App.css'
import pages, {Pages} from "./pages/pages";
import {useSelector} from "react-redux";
import {getPage} from "./store/general/general.selector";

function App() {
  const page = useSelector(getPage) as Pages;
  const Page = pages[page];
  return <Page />;
}

export default App;
