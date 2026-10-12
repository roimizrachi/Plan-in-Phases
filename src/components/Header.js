import { html } from '../html.js';

export function Header() {
  return html`
    <header class="site-header" id="top">
      <a class="site-name" href="#top">Roei Mazar</a>
      <nav aria-label="Main">
        <a href="#about">About</a>
        <a href="#projects">Projects</a>
        <a href="#contact">Contact</a>
      </nav>
    </header>
  `;
}
