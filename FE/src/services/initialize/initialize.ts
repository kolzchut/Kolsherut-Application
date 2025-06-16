import loadConfig from './loadConfig';
import ReactDOM from 'react-dom/client';
import React from "react";
import testConnection from "../sendMessage/testConnection";

export default async (main: React.ReactNode) => {
    await loadConfig();
    await testConnection();
    ReactDOM.createRoot(document.getElementById('root')!).render(main);
};
