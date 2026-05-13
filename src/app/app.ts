import { Component, inject, OnInit } from '@angular/core';
import { ProjectService } from './core/services/project.service';
import { TaskService } from './core/services/task.service';
import { NoteService } from './core/services/note.service';
import { AuthService } from './core/services/auth.service';
import { ShellComponent } from './features/shell/shell';
import { LoginComponent } from './features/login/login';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected auth = inject(AuthService);
  private projectService = inject(ProjectService);
  private taskService = inject(TaskService);
  private noteService = inject(NoteService);

  async ngOnInit(): Promise<void> {
    await this.auth.init();
    await Promise.all([
      this.projectService.loadAll(),
      this.taskService.loadAll(),
      this.noteService.loadAll(),
    ]);
  }
}
