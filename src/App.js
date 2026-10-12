import { html } from './html.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { About } from './components/About.js';
import { Projects } from './components/Projects.js';
import { Contact } from './components/Contact.js';

export function App() {
  return html`
    <${Header} />
    <main>
      <${About} />
      <${Projects} />
      <${Contact} />
    </main>
    <${Footer} />
  `;
}
