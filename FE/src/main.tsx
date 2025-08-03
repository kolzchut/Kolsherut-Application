import App from './App'
import initialize from "./services/initialize";
import './main.css';
import './fonts.css';
import {Provider} from 'react-redux';
import {store} from "./store/store";
import {JssProvider} from "react-jss";

const main = (
    <Provider store={store}>
        <JssProvider generateId={() => '' + Math.random()}>
            <App/>
        </JssProvider>
    </Provider>
);

initialize(main).catch(error => {
    console.error(`Initialization failed: ${error}`);
});
