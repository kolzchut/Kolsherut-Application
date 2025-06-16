import './App.css'
import pages from "./pages/pages";

function App() {
  const page = 'home';
  const Page = pages[page];
  return(<Page/>);
}

export default App;
