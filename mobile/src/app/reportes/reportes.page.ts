import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: linear-gradient(135deg,#004d2a,#006039);">
        <ion-title style="color:#fff; font-weight:800;">Reportes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content style="--background:#f4f6f7;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:16px;color:#94a3b8;">
        <ion-icon name="bar-chart-outline" style="font-size:64px;opacity:.4;"></ion-icon>
        <p style="font-size:14px;font-weight:600;text-align:center;">Módulo de Reportes<br>en desarrollo</p>
      </div>
    </ion-content>
  `,
})
export class ReportesPage {
  constructor() { addIcons({ barChartOutline }); }
}
