import { html } from '../html.js';

export function ProjectCard({ project }) {
  return html`
    <article class="project-card">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      <ul class="tags" aria-label="Technologies">
        ${project.tags.map((tag) => html`<li key=${tag}>${tag}</li>`)}
      </ul>
      <a href=${project.link} target="_blank" rel="noopener noreferrer">View project</a>
    </article>
  `;
}
