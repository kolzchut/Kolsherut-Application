import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";

export default async (main: React.ReactNode) => {
    await loadConfig();
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
