import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  barChartOutline
} from 'ionicons/icons';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend?: string;
  trendLabel?: string;
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
  imports: [CommonModule, IonicModule],
})
export class DashboardComponent implements OnInit {

  // Overall Stats
  totalRegistrados = 1250430;
  totalValidados = 850210;
  totalPendientes = 400220;

  // Mock Data
  genderStats = {
    male: 600206,
    female: 650224
  };

  ageRanges: ProgressBar[] = [
    { label: '18 - 25 años', value: 250000, total: 1250430, percentage: 20, color: '#00A651' },
    { label: '26 - 35 años', value: 450000, total: 1250430, percentage: 36, color: '#34A853' },
    { label: '36 - 45 años', value: 300000, total: 1250430, percentage: 24, color: '#4CAF50' },
    { label: '46 - 55 años', value: 150000, total: 1250430, percentage: 12, color: '#81C784' },
    { label: '56+ años', value: 100430, total: 1250430, percentage: 8, color: '#A5D6A7' }
  ];

  provinceStats: ProgressBar[] = [
    { label: 'Santo Domingo', value: 450200, total: 1250430, percentage: 36, color: '#00A651' },
    { label: 'Distrito Nacional', value: 280100, total: 1250430, percentage: 22, color: '#F1C40F' },
    { label: 'Santiago', value: 190500, total: 1250430, percentage: 15, color: '#E67E22' },
    { label: 'San Cristóbal', value: 110000, total: 1250430, percentage: 9, color: '#3498DB' },
    { label: 'La Vega', value: 85000, total: 1250430, percentage: 7, color: '#9B59B6' },
  ];

  recintosStats = [
    { name: 'Escuela Patria Mella', province: 'Santo Domingo Este', users: 1520, progress: 85 },
    { name: 'Liceo Unión Panamericana', province: 'Distrito Nacional', users: 1250, progress: 92 },
    { name: 'Politécnico Las Américas', province: 'Santo Domingo Oeste', users: 980, progress: 65 },
    { name: 'Escuela Brasil', province: 'Distrito Nacional', users: 840, progress: 78 }
  ];

  constructor() {
    addIcons({ 
      peopleOutline, checkmarkCircleOutline, timeOutline, mapOutline, 
      maleFemaleOutline, businessOutline, statsChartOutline, pieChartOutline, barChartOutline 
    });
  }

  ngOnInit() {}

  get validationPercentage(): number {
    return Math.round((this.totalValidados / this.totalRegistrados) * 100);
  }

  get malePercentage(): number {
    return Math.round((this.genderStats.male / this.totalRegistrados) * 100);
  }

  get femalePercentage(): number {
    return Math.round((this.genderStats.female / this.totalRegistrados) * 100);
  }

}
