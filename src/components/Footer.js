import { html } from '../html.js';

export function Footer() {
  return html`
    <footer class="site-footer">
      <p>© ${new Date().getFullYear()} Roei Mazar</p>
    </footer>
  `;
}
