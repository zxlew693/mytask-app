import { Component, inject, OnInit } from '@angular/core';
import { ProjectService } from './core/services/project.service';
import { TaskService } from './core/services/task.service';
import { ShellComponent } from './features/shell/shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.projectService.loadAll(),
      this.taskService.loadAll(),
    ]);
  }
}
