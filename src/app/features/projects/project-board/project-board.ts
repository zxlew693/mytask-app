import { Component, inject } from '@angular/core';
import { ProjectCardComponent } from '../project-card/project-card';
import { ProjectService } from '../../../core/services/project.service';

@Component({
  selector: 'app-project-board',
  standalone: true,
  imports: [ProjectCardComponent],
  templateUrl: './project-board.html',
  styleUrl: './project-board.css',
})
export class ProjectBoardComponent {
  protected projectService = inject(ProjectService);
}
