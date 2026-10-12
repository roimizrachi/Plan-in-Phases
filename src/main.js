import { createRoot } from 'react-dom/client';
import { html } from './html.js';
import { App } from './App.js';

createRoot(document.getElementById('root')).render(html`<${App} />`);
