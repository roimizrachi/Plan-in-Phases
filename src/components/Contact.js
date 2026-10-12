import { html } from '../html.js';
import { contact } from '../data/contact.js';

export function Contact() {
  return html`
    <section id="contact">
      <h2>Contact</h2>
      ${contact.email &&
      html`
        <p>
          Email:
          <a href=${`mailto:${contact.email}`}>${contact.email}</a>
        </p>
      `}
      <ul class="social-links">
        ${contact.socials.map(
          (s) => html`
            <li key=${s.label}>
              <a href=${s.url} target="_blank" rel="noopener noreferrer">${s.label}</a>
            </li>
          `
        )}
      </ul>
    </section>
  `;
}
