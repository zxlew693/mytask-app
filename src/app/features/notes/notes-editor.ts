import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { NoteService } from '../../core/services/note.service';
import { NotesCryptoService } from '../../core/services/notes-crypto.service';

@Component({
  selector: 'app-notes-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notes-editor.html',
})
export class NotesEditorComponent implements AfterViewInit, OnDestroy {
  protected noteService = inject(NoteService);
  private cryptoService = inject(NotesCryptoService);

  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  protected isSaving = signal(false);
  protected hasKey = this.cryptoService.hasKey;

  private editor: Editor | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private settingContent = false;

  constructor() {

    // When editorContent signal changes (after async decrypt), push into Tiptap
    effect(() => {
      const content = this.noteService.editorContent();
      if (this.editor && !this.settingContent) {
        this.settingContent = true;
        this.editor.commands.setContent(content || '', { emitUpdate: false });
        this.settingContent = false;
      }
    });

    // When key is cleared (logout), clear editor
    effect(() => {
      if (!this.cryptoService.hasKey() && this.editor) {
        this.settingContent = true;
        this.editor.commands.setContent('', { emitUpdate: false });
        this.settingContent = false;
        this.noteService.reset();
      }
    });
  }

  ngAfterViewInit(): void {
    this.editor = new Editor({
      element: this.editorEl.nativeElement,
      extensions: [StarterKit],
      content: '',
      editorProps: {
        attributes: { class: 'outline-none min-h-full' },
      },
    });

    this.editor.on('update', () => {
      if (this.settingContent) return;
      if (this.saveTimer) clearTimeout(this.saveTimer);
      this.saveTimer = setTimeout(() => this.autoSave(), 800);
    });

  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.editor?.destroy();
  }

  private async autoSave(): Promise<void> {
    if (!this.editor || !this.cryptoService.hasKey() || !this.noteService.selectedNoteId()) return;
    this.isSaving.set(true);
    try {
      await this.noteService.save(this.editor.getHTML());
    } finally {
      this.isSaving.set(false);
    }
  }

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  isActive(name: string): boolean {
    return this.editor?.isActive(name) ?? false;
  }
}
