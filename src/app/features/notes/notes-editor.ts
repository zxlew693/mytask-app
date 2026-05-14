import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  NgZone,
  OnDestroy,
  signal,
  ViewChild,
  effect,
  untracked,
} from '@angular/core';
import { NoteService } from '../../core/services/note.service';
import { NotesCryptoService } from '../../core/services/notes-crypto.service';
import Quill from 'quill';

const FONT_WHITELIST = ['arial', 'calibri', 'lexend', 'inter', 'roboto', 'sans-serif', 'serif', 'monospace'];
const FontAttributor = Quill.import('formats/font') as any;
FontAttributor.whitelist = FONT_WHITELIST;
Quill.register(FontAttributor, true);

const SIZE_WHITELIST = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px'];
const SizeAttributor = Quill.import('formats/size') as any;
SizeAttributor.whitelist = SIZE_WHITELIST;
Quill.register(SizeAttributor, true);

const TOOLBAR_OPTIONS = [
  [{ font: FONT_WHITELIST }, { size: SIZE_WHITELIST }],
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ color: [] }, { background: [] }],
];

@Component({
  selector: 'app-notes-editor',
  standalone: true,
  imports: [],
  templateUrl: './notes-editor.html',
})
export class NotesEditorComponent implements AfterViewInit, OnDestroy {
  protected noteService = inject(NoteService);
  private cryptoService = inject(NotesCryptoService);
  private zone = inject(NgZone);

  @ViewChild('editorEl') editorEl!: ElementRef<HTMLDivElement>;

  protected isSaving = signal(false);
  protected editingTitle = signal(false);
  protected titleDraft = signal('');
  protected selectedNote = computed(() =>
    this.noteService.notes().find(n => n.id === this.noteService.selectedNoteId()) ?? null
  );

  private quill: Quill | null = null;
  private savedSelection: { index: number; length: number } | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Push new note content into Quill without triggering a save
    effect(() => {
      const content = this.noteService.editorContent();
      untracked(() => {
        if (!this.quill) return;
        const current = this.quill.root.innerHTML;
        // Only update if different to avoid cursor disruption
        if (current !== content) {
          const sel = this.quill.getSelection();
          this.quill.root.innerHTML = content || '';
          if (sel) this.quill.setSelection(sel, 'silent');
        }
      });
    });

    // Clear editor on logout
    effect(() => {
      const hasKey = this.cryptoService.hasKey();
      untracked(() => {
        if (!hasKey && this.quill) {
          this.quill.root.innerHTML = '';
          this.noteService.reset();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.quill = new Quill(this.editorEl.nativeElement, {
        theme: 'snow',
        modules: { toolbar: TOOLBAR_OPTIONS },
        placeholder: 'Start writing…',
      });

      // Save selection on blur so toolbar clicks don't lose it
      this.quill.on('selection-change', (range) => {
        if (range) this.savedSelection = range;
      });

      // Restore saved selection after toolbar click without blocking blur on other elements
      const toolbar = this.editorEl.nativeElement.previousElementSibling as HTMLElement;
      toolbar?.addEventListener('mousedown', () => {
        if (this.savedSelection) {
          setTimeout(() => {
            this.quill!.focus();
            this.quill!.setSelection(this.savedSelection!, 'silent');
          }, 0);
        }
      });

      this.quill.on('text-change', (_delta, _old, source) => {
        if (source !== 'user') return;
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => this.zone.run(() => this.autoSave()), 800);
      });
    });
  }

  ngOnDestroy(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.quill = null;
  }

  private async autoSave(): Promise<void> {
    if (!this.quill || !this.cryptoService.hasKey() || !this.noteService.selectedNoteId()) return;
    this.isSaving.set(true);
    try {
      await this.noteService.save(this.quill.root.innerHTML);
    } finally {
      this.isSaving.set(false);
    }
  }

  startEditingTitle(): void {
    this.titleDraft.set(this.selectedNote()?.title ?? '');
    this.editingTitle.set(true);
  }

  async commitTitle(): Promise<void> {
    if (!this.editingTitle()) return;
    this.editingTitle.set(false);
    const id = this.noteService.selectedNoteId();
    if (!id) return;
    await this.noteService.rename(id, this.titleDraft());
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(e: MouseEvent): void {
    if (!this.editingTitle()) return;
    const titleInput = (e.target as HTMLElement).closest('input');
    if (!titleInput) this.commitTitle();
  }

  onTitleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Enter') { e.preventDefault(); this.commitTitle(); }
    if (e.key === 'Escape') { this.editingTitle.set(false); }
  }

  exportAsText(): void {
    if (!this.quill) return;
    const text = this.quill.getText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `note-${this.noteService.selectedNoteId() ?? 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
