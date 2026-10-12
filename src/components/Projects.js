import { html } from '../html.js';
import { projects } from '../data/projects.js';
import { ProjectCard } from './ProjectCard.js';

export function Projects() {
  return html`
    <section id="projects">
      <h2>Projects</h2>
      <div class="project-grid">
        ${projects.map((project) => html`<${ProjectCard} key=${project.title} project=${project} />`)}
      </div>
    </section>
  `;
}
