import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { Subscription } from 'rxjs';

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface ProvinceMapData {
  /** Must match the SVG path's id attribute (e.g. 'DO-25') */
  id: string;
  name: string;
  /** Actual value being measured */
  value: number;
  /** Reference/expected value for semaphore calculation */
  expected: number;
  /** Optional arbitrary metadata for display */
  meta?: Record<string, unknown>;
}

export interface ProvinceClickEvent {
  province: ProvinceMapData;
  svgId: string;
}

// ─── Semaphore colour constants ────────────────────────────────────────────────

export const MAP_COLORS = {
  GREEN:   '#22c55e',
  YELLOW:  '#f59e0b',
  RED:     '#ef4444',
  DEFAULT: '#d1d5db',
  HOVER:   '#93c5fd',
  SELECTED:'#3b82f6',
} as const;

// ─── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-dominican-map',
  templateUrl: './dominican-map.component.html',
  styleUrls: ['./dominican-map.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DominicanMapComponent implements OnInit, OnChanges, OnDestroy {

  /** Province data received from parent. Each item must have a matching SVG id. */
  @Input() provinces: ProvinceMapData[] = [];

  /** Emits when the user taps/clicks a province */
  @Output() provinceClick = new EventEmitter<ProvinceClickEvent>();

  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef<HTMLDivElement>;

  // Internal state
  svgMarkup: SafeHtml | null = null;
  isLoading = true;
  hasError = false;

  selectedProvinceId: string | null = null;
  hoveredProvinceId: string | null = null;
  tooltipProvince: ProvinceMapData | null = null;
  tooltipVisible = false;

  private svgLoaded = false;
  private subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadSvg();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['provinces'] && this.svgLoaded) {
      this.applyColorsToSvg();
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  // ── SVG Loading ────────────────────────────────────────────────────────────

  private loadSvg(): void {
    this.isLoading = true;
    this.hasError = false;

    const sub = this.http
      .get('assets/dominicanRepublicHigh.svg', { responseType: 'text' })
      .subscribe({
        next: (svgText: string) => {
          // Inject the raw SVG into the DOM so we can manipulate paths directly
          this.svgMarkup = this.sanitizer.bypassSecurityTrustHtml(svgText);
          this.isLoading = false;
          this.cdr.markForCheck();

          // Wait one tick for the SVG to render, then colour it
          setTimeout(() => {
            this.svgLoaded = true;
            this.applyColorsToSvg();
            this.attachEventListeners();
          }, 50);
        },
        error: (err: unknown) => {
          console.error('[DominicanMap] Failed to load SVG', err);
          this.hasError = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });

    this.subscription.add(sub);
  }

  // ── Colour Logic ───────────────────────────────────────────────────────────

  /**
   * Semaphore rule:
   *   value >= expected              → GREEN
   *   value >= expected * 0.7        → YELLOW
   *   value <  expected * 0.7        → RED
   *   no data                        → DEFAULT (grey)
   */
  getProvinceColor(provinceId: string): string {
    const data = this.provinces.find(p => p.id === provinceId);
    if (!data) return MAP_COLORS.DEFAULT;
    return this.semaphoreColor(data.value, data.expected);
  }

  semaphoreColor(value: number, expected: number): string {
    if (value >= expected)             return MAP_COLORS.GREEN;
    if (value >= expected * 0.7)       return MAP_COLORS.YELLOW;
    return MAP_COLORS.RED;
  }

  semaphoreLabel(value: number, expected: number): 'satisfactorio' | 'alerta' | 'crítico' {
    if (value >= expected)             return 'satisfactorio';
    if (value >= expected * 0.7)       return 'alerta';
    return 'crítico';
  }

  private applyColorsToSvg(): void {
    const container = this.mapContainerRef?.nativeElement;
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    // Ensure SVG is fully responsive
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';

    // Apply base styles + colours to every path
    const paths = svg.querySelectorAll<SVGPathElement>('path[id]');
    paths.forEach(path => {
      const id = path.getAttribute('id') ?? '';
      const color = this.getProvinceColor(id);

      path.style.fill = color;
      path.style.stroke = '#ffffff';
      path.style.strokeWidth = '0.8';
      path.style.cursor = 'pointer';
      path.style.transition = 'fill 0.25s ease, filter 0.2s ease';

      // Highlight selected
      if (id === this.selectedProvinceId) {
        path.style.filter = 'brightness(1.15) drop-shadow(0 0 4px rgba(0,0,0,0.4))';
        path.style.strokeWidth = '1.5';
      } else {
        path.style.filter = 'none';
        path.style.strokeWidth = '0.8';
      }
    });
  }

  // ── Event Listeners on SVG paths ──────────────────────────────────────────

  private attachEventListeners(): void {
    const container = this.mapContainerRef?.nativeElement;
    if (!container) return;

    const svg = container.querySelector('svg');
    if (!svg) return;

    const paths = svg.querySelectorAll<SVGPathElement>('path[id]');

    paths.forEach(path => {
      const id = path.getAttribute('id') ?? '';

      // Click / Tap
      path.addEventListener('click', () => this.onPathClick(id));

      // Hover (desktop)
      path.addEventListener('mouseenter', () => this.onPathHover(id, path, true));
      path.addEventListener('mouseleave', () => this.onPathHover(id, path, false));

      // Touch (mobile)
      path.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.onPathClick(id);
      }, { passive: false });
    });
  }

  private onPathClick(id: string): void {
    const data = this.provinces.find(p => p.id === id);

    if (this.selectedProvinceId === id) {
      // Deselect
      this.selectedProvinceId = null;
      this.tooltipProvince = null;
      this.tooltipVisible = false;
    } else {
      this.selectedProvinceId = id;
      this.tooltipProvince = data ?? null;
      this.tooltipVisible = !!data;
    }

    this.applyColorsToSvg();
    this.cdr.markForCheck();

    if (data) {
      this.provinceClick.emit({ province: data, svgId: id });
    }
  }

  private onPathHover(id: string, path: SVGPathElement, entering: boolean): void {
    if (entering) {
      this.hoveredProvinceId = id;
      if (id !== this.selectedProvinceId) {
        path.style.filter = 'brightness(1.1)';
      }
    } else {
      this.hoveredProvinceId = null;
      if (id !== this.selectedProvinceId) {
        path.style.filter = 'none';
      }
    }
    this.cdr.markForCheck();
  }

  // ── Public helpers for template ────────────────────────────────────────────

  closeTooltip(): void {
    this.tooltipVisible = false;
    this.selectedProvinceId = null;
    this.tooltipProvince = null;
    this.applyColorsToSvg();
    this.cdr.markForCheck();
  }

  getPercentage(data: ProvinceMapData): number {
    if (!data.expected) return 0;
    return Math.round((data.value / data.expected) * 100);
  }

  /** Legend items */
  readonly legend = [
    { color: MAP_COLORS.GREEN,   label: 'Satisfactorio',  desc: '≥ 100% del esperado' },
    { color: MAP_COLORS.YELLOW,  label: 'En Alerta',      desc: '70–99% del esperado' },
    { color: MAP_COLORS.RED,     label: 'Crítico',        desc: '< 70% del esperado'  },
    { color: MAP_COLORS.DEFAULT, label: 'Sin datos',      desc: 'No disponible'        },
  ];
}
