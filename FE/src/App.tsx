import './App.css'
import pages from "./pages/pages.ts";

function App() {
  const page = 'home';
  const Page = pages[page];
  return(<Page/>);
}

export default App;
