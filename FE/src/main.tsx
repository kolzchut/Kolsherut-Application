import App from './App'
import initialize from "./services/initialize";
import './main.css'
import { Provider } from 'react-redux';
import {store} from "./store/store";

const main = (
    <Provider store={store}>
        <App/>
    </Provider>
);

initialize(main).catch(error => {
    console.error(`Initialization failed: ${error}`);
});
