import { Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { DragDropModule } from '@angular/cdk/drag-drop';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, DragDropModule],
  template: `
    <div cdkDrag cdkDragRootElement=".cdk-overlay-pane" class="flex flex-col gap-4 rounded-xl p-6" style="font-family: 'Lexend', sans-serif;">
      <h2 cdkDragHandle class="cursor-move select-none text-base font-semibold text-slate-800 dark:text-vscode-100">
        {{ data.title }}
      </h2>
      <p class="text-sm text-slate-500 dark:text-vscode-300">{{ data.message }}</p>
      <div class="flex justify-end gap-2">
        <button
          class="cursor-pointer rounded-md border border-slate-200 bg-transparent px-3.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-vscode-600 dark:text-vscode-200 dark:hover:bg-vscode-700"
          [mat-dialog-close]="false"
        >Cancel</button>
        <button
          class="cursor-pointer rounded-md bg-red-500 px-3.5 py-1.5 text-sm text-white transition-colors hover:bg-red-600"
          [mat-dialog-close]="true"
        >{{ data.confirmLabel ?? 'Delete' }}</button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected dialogRef = inject(MatDialogRef<ConfirmDialogComponent>);
}
