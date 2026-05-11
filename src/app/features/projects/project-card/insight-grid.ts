import { Component, computed, input } from '@angular/core';

interface GridCell {
  x: number;
  y: number;
  date: string;
  count: number;
  label: string;
  colorClass: string;
}

@Component({
  selector: 'app-insight-grid',
  standalone: true,
  templateUrl: './insight-grid.html',
  styleUrl: './insight-grid.css',
})
export class InsightGridComponent {
  readonly dayMap = input.required<ReadonlyMap<string, number>>();
  readonly year = input.required<number>();

  protected readonly CELL = 14;
  protected readonly STEP = 17;
  protected readonly LEFT_OFFSET = 36;
  protected readonly TOP_OFFSET = 22;

  // All 7 days Mon–Sun (Mon = row 0)
  protected readonly DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  protected readonly cells = computed((): GridCell[] => {
    const map = this.dayMap();
    const y = this.year();

    // Jan 1 of selected year
    const jan1 = new Date(y, 0, 1);
    // Grid starts on the Monday on or before Jan 1
    // getDay(): 0=Sun,1=Mon,...,6=Sat → Mon-based offset
    const dayOfWeek = jan1.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const start = new Date(y, 0, 1 - mondayOffset);

    // Grid ends on the Sunday on or after Dec 31
    const dec31 = new Date(y, 11, 31);
    const dec31Day = dec31.getDay();
    const sundayOffset = dec31Day === 0 ? 0 : 7 - dec31Day;
    const end = new Date(y, 11, 31 + sundayOffset);

    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const cols = totalDays / 7;

    const cells: GridCell[] = [];
    const d = new Date(start);

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < 7; row++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const count = map.get(dateStr) ?? 0;
        const inYear = d.getFullYear() === y;
        const label = `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} — ${count} task${count !== 1 ? 's' : ''}`;
        cells.push({
          x: this.LEFT_OFFSET + col * this.STEP,
          y: this.TOP_OFFSET + row * this.STEP,
          date: dateStr,
          count,
          label,
          colorClass: !inYear ? 'cell-out' : count === 0 ? 'cell-0' : count <= 2 ? 'cell-1' : count <= 4 ? 'cell-2' : 'cell-3',
        });
        d.setDate(d.getDate() + 1);
      }
    }
    return cells;
  });

  protected readonly monthLabels = computed((): { x: number; label: string }[] => {
    const y = this.year();
    const labels: { x: number; label: string }[] = [];
    let lastMonth = -1;
    for (const cell of this.cells()) {
      if (cell.y !== this.TOP_OFFSET) continue; // Monday row only
      const d = new Date(cell.date + 'T00:00:00');
      if (d.getFullYear() !== y) continue; // skip days outside selected year
      const month = d.getMonth();
      if (month !== lastMonth) {
        labels.push({ x: cell.x, label: d.toLocaleString(undefined, { month: 'short' }) });
        lastMonth = month;
      }
    }
    return labels;
  });

  protected readonly cols = computed(() => {
    const cells = this.cells();
    return cells.length > 0 ? Math.max(...cells.map(c => c.x)) / this.STEP + 1 : 53;
  });

  protected readonly svgWidth = computed(() => {
    const cells = this.cells();
    if (cells.length === 0) return this.LEFT_OFFSET + 53 * this.STEP;
    return Math.max(...cells.map(c => c.x)) + this.CELL + 1;
  });
  protected readonly svgHeight = computed(() => this.TOP_OFFSET + 7 * this.STEP + 2);
}
