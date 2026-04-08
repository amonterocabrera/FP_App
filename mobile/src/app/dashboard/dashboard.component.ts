import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  peopleOutline,
  checkmarkCircleOutline,
  timeOutline,
  mapOutline,
  maleFemaleOutline,
  businessOutline,
  statsChartOutline,
  pieChartOutline,
  barChartOutline,
  trendingUpOutline,
  location,
  alertCircle,
  checkmarkCircle,
  chevronDownOutline,
  closeOutline,
} from 'ionicons/icons';
import {
  DominicanMapComponent,
  ProvinceMapData,
  ProvinceClickEvent,
} from '../shared/components/dominican-map';

export interface ProvinceData {
  id: string;
  name: string;
  registrados: number;
  validados: number;
  pendientes: number;
  recintos: number;
}

interface ProgressBar {
  label: string;
  value: number;
  total: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, HttpClientModule, DominicanMapComponent],
})
export class DashboardComponent implements OnInit {

  // Overall Stats
  totalRegistrados = 248735;
  totalValidados = 214560;
  totalPendientes = 34175;
  totalRecintos = 1492;

  selectedProvince: ProvinceData | null = null;
  hoveredProvinceId: string | null = null;

  // Province data keyed by SVG path ID
  provinces: ProvinceData[] = [
    { id: 'DO-01', name: 'Distrito Nacional', registrados: 28010, validados: 25200, pendientes: 2810, recintos: 95 },
    { id: 'DO-02', name: 'Azua', registrados: 8500, validados: 6800, pendientes: 1700, recintos: 42 },
    { id: 'DO-03', name: 'Baoruco', registrados: 5200, validados: 4100, pendientes: 1100, recintos: 25 },
    { id: 'DO-04', name: 'Barahona', registrados: 7300, validados: 5900, pendientes: 1400, recintos: 38 },
    { id: 'DO-05', name: 'Dajabón', registrados: 3800, validados: 3100, pendientes: 700, recintos: 18 },
    { id: 'DO-06', name: 'Duarte', registrados: 9200, validados: 7800, pendientes: 1400, recintos: 45 },
    { id: 'DO-08', name: 'El Seibo', registrados: 4600, validados: 3700, pendientes: 900, recintos: 22 },
    { id: 'DO-09', name: 'Espaillat', registrados: 7100, validados: 6000, pendientes: 1100, recintos: 35 },
    { id: 'DO-30', name: 'Hato Mayor', registrados: 4200, validados: 3400, pendientes: 800, recintos: 20 },
    { id: 'DO-10', name: 'Independencia', registrados: 3500, validados: 2800, pendientes: 700, recintos: 17 },
    { id: 'DO-11', name: 'La Altagracia', registrados: 8900, validados: 7500, pendientes: 1400, recintos: 44 },
    { id: 'DO-07', name: 'Elías Piña', registrados: 3100, validados: 2400, pendientes: 700, recintos: 15 },
    { id: 'DO-12', name: 'La Romana', registrados: 9100, validados: 7800, pendientes: 1300, recintos: 46 },
    { id: 'DO-13', name: 'La Vega', registrados: 11200, validados: 9600, pendientes: 1600, recintos: 55 },
    { id: 'DO-14', name: 'María Trinidad Sánchez', registrados: 5800, validados: 4700, pendientes: 1100, recintos: 28 },
    { id: 'DO-28', name: 'Monseñor Nouel', registrados: 6300, validados: 5400, pendientes: 900, recintos: 31 },
    { id: 'DO-15', name: 'Monte Cristi', registrados: 4900, validados: 3900, pendientes: 1000, recintos: 24 },
    { id: 'DO-29', name: 'Monte Plata', registrados: 6100, validados: 4900, pendientes: 1200, recintos: 30 },
    { id: 'DO-16', name: 'Pedernales', registrados: 2800, validados: 2200, pendientes: 600, recintos: 13 },
    { id: 'DO-17', name: 'Peravia', registrados: 7600, validados: 6500, pendientes: 1100, recintos: 37 },
    { id: 'DO-18', name: 'Puerto Plata', registrados: 10500, validados: 9000, pendientes: 1500, recintos: 52 },
    { id: 'DO-19', name: 'Hermanas Mirabal', registrados: 4400, validados: 3600, pendientes: 800, recintos: 21 },
    { id: 'DO-20', name: 'Samaná', registrados: 4700, validados: 3800, pendientes: 900, recintos: 23 },
    { id: 'DO-21', name: 'San Cristóbal', registrados: 14800, validados: 12900, pendientes: 1900, recintos: 73 },
    { id: 'DO-31', name: 'San José de Ocoa', registrados: 3700, validados: 3000, pendientes: 700, recintos: 18 },
    { id: 'DO-22', name: 'San Juan', registrados: 8200, validados: 6800, pendientes: 1400, recintos: 41 },
    { id: 'DO-23', name: 'San Pedro de Macorís', registrados: 11600, validados: 9900, pendientes: 1700, recintos: 57 },
    { id: 'DO-24', name: 'Sánchez Ramírez', registrados: 6000, validados: 4900, pendientes: 1100, recintos: 29 },
    { id: 'DO-25', name: 'Santiago', registrados: 19050, validados: 16500, pendientes: 2550, recintos: 94 },
    { id: 'DO-26', name: 'Santiago Rodríguez', registrados: 3400, validados: 2700, pendientes: 700, recintos: 16 },
    { id: 'DO-32', name: 'Santo Domingo', registrados: 45020, validados: 39500, pendientes: 5520, recintos: 220 },
    { id: 'DO-27', name: 'Valverde', registrados: 5800, validados: 4900, pendientes: 900, recintos: 28 },
  ];

  get maxRegistrados(): number {
    return Math.max(...this.provinces.map(p => p.registrados));
  }

  getProvinceById(id: string): ProvinceData | undefined {
    return this.provinces.find(p => p.id === id);
  }

  getProvinceColor(id: string): string {
    const prov = this.getProvinceById(id);
    if (!prov) return '#82C785';
    const ratio = prov.registrados / this.maxRegistrados;
    if (ratio > 0.8) return '#004d2a';
    if (ratio > 0.6) return '#006039';
    if (ratio > 0.4) return '#008f56';
    if (ratio > 0.2) return '#00A651';
    return '#5ecb8e';
  }

  getProvinceOpacity(id: string): number {
    if (this.selectedProvince?.id === id) return 1;
    if (this.hoveredProvinceId === id) return 0.85;
    return 0.9;
  }

  onProvinceClick(id: string): void {
    const prov = this.getProvinceById(id);
    if (prov) {
      this.selectedProvince = prov === this.selectedProvince ? null : prov;
    }
  }

  onProvinceHover(id: string | null): void {
    this.hoveredProvinceId = id;
  }

  clearSelection(): void {
    this.selectedProvince = null;
  }

  // ── Semaphore map data (ProvinceMapData[]) ──────────────────────────────────
  // Meta esperada = 80% del total de registrados de la provincia más grande
  private readonly META_PORCENTAJE = 0.8; // 80% de cumplimiento esperado

  /** Convierte los datos de provincia al formato que espera DominicanMapComponent */
  get mapData(): ProvinceMapData[] {
    const maxReg = this.maxRegistrados;
    const expectedBase = Math.round(maxReg * this.META_PORCENTAJE);

    return this.provinces.map(p => ({
      id: p.id,
      name: p.name,
      // Valor: porcentaje de validados sobre el total registrado (0-100)
      value: Math.round((p.validados / p.registrados) * 100),
      // Esperado: 80%
      expected: 80,
    }));
  }

  /** Selección actual del mapa interactivo */
  selectedMapProvince: ProvinceMapData | null = null;

  onMapProvinceSelected(event: ProvinceClickEvent): void {
    this.selectedMapProvince = event.province;
    // También sincronizamos con el panel de detalle legacy si existe
    const legacy = this.getProvinceById(event.svgId);
    this.selectedProvince = legacy ?? null;
  }

  get recintosStats() {
    return [
      { name: 'Escuela Patria Mella', province: 'Santo Domingo Este', users: 1520, progress: 85 },
      { name: 'Liceo Unión Panamericana', province: 'Distrito Nacional', users: 1250, progress: 92 },
      { name: 'Politécnico Las Américas', province: 'Santo Domingo Oeste', users: 980, progress: 65 },
      { name: 'Escuela Brasil', province: 'Distrito Nacional', users: 840, progress: 78 },
      { name: 'Escuela República de México', province: 'Santiago', users: 760, progress: 71 },
    ];
  }

  // Mock Data for demographics
  genderStats = { male: 600206, female: 650224 };

  ageRanges: ProgressBar[] = [
    { label: '18 - 25 años', value: 250000, total: 1250430, percentage: 20, color: '#00A651' },
    { label: '26 - 35 años', value: 450000, total: 1250430, percentage: 36, color: '#34A853' },
    { label: '36 - 45 años', value: 300000, total: 1250430, percentage: 24, color: '#4CAF50' },
    { label: '46 - 55 años', value: 150000, total: 1250430, percentage: 12, color: '#81C784' },
    { label: '56+ años',  value: 100430, total: 1250430, percentage: 8, color: '#A5D6A7' }
  ];

  constructor() {
    addIcons({ 
      peopleOutline, checkmarkCircleOutline, timeOutline, mapOutline, 
      maleFemaleOutline, businessOutline, statsChartOutline, pieChartOutline, barChartOutline,
      trendingUpOutline, location, alertCircle, checkmarkCircle, chevronDownOutline, closeOutline
    });
  }

  ngOnInit() {}

  get validationPercentage(): number {
    return Math.round((this.totalValidados / this.totalRegistrados) * 100);
  }
}
