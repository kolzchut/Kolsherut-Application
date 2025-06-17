import './App.css'
import pages from "./pages/pages";
import {useSelector} from "react-redux";
import {getPage} from "./store/general/general.selector";

function App() {
  const page = useSelector(getPage) as keyof typeof pages;
  const Page = pages[page];
  return <Page />;
}

export default App;
