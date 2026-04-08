import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonasService } from '../core/services/personas.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, 
  IonButton, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, documentTextOutline, downloadOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonIcon, IonButton, IonSpinner, CommonModule],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar style="--background: linear-gradient(135deg,#004d2a,#006039);">
        <ion-title style="color:#fff; font-weight:800;">Reportes</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content style="--background:#f4f6f7;">
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60vh;gap:24px;color:#94a3b8; padding: 20px;">
        <ion-icon name="document-text-outline" style="font-size:64px;color:#16A34A;opacity:.8;"></ion-icon>
        
        <div style="text-align: center;">
          <h2 style="color: #1e293b; font-weight: 700; margin: 0 0 8px 0;">Mis Registros</h2>
          <p style="font-size:14px;font-weight:500;text-align:center; margin: 0;">Descarga el listado completo de las personas que has empadronado en el sistema.</p>
        </div>

        <ion-button 
          (click)="descargarReporte()" 
          [disabled]="isDownloading"
          shape="round" 
          style="--background: #16A34A; --box-shadow: 0 4px 12px rgba(22,163,74,0.3); font-weight: bold; width: 100%; max-width: 300px;">
          <ion-spinner *ngIf="isDownloading" name="crescent" slot="start"></ion-spinner>
          <ion-icon *ngIf="!isDownloading" name="download-outline" slot="start"></ion-icon>
          {{ isDownloading ? 'Generando PDF...' : 'Descargar PDF' }}
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class ReportesPage {
  private personasSvc = inject(PersonasService);
  private toastCtrl = inject(ToastController);
  isDownloading = false;

  constructor() {
    addIcons({ barChartOutline, documentTextOutline, downloadOutline });
  }

  descargarReporte() {
    this.isDownloading = true;

    // Obtener hasta 1000 registros (o se puede hacer paginación iterativa)
    this.personasSvc.getMisRegistros('', 1, 1000).subscribe({
      next: (res) => {
        if (res.items.length === 0) {
          this.showToast('No tienes personas registradas aún.', 'warning');
          this.isDownloading = false;
          return;
        }

        this.generarPdf(res.items);
      },
      error: (err) => {
        this.showToast('Error al descargar el reporte.', 'danger');
        this.isDownloading = false;
      }
    });
  }

  private generarPdf(personas: any[]) {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.setTextColor(22, 163, 74); // #16A34A
      doc.text('Reporte de Mis Registros (Gestión Electoral)', 14, 22);
      
      // Subtítulo / Fecha
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
      doc.text(`Total Registrados: ${personas.length}`, 14, 35);

      // Tabla
      const tableData = personas.map((p, i) => [
        (i + 1).toString(),
        p.cedula,
        p.nombreCompleto || `${p.nombre} ${p.apellido}`,
        p.genero,
        p.isActive ? 'Activo' : 'Inactivo',
        p.fechaNacimiento ? new Date(p.fechaNacimiento).toLocaleDateString() : 'N/A'
      ]);

      const head = [['#', 'Cédula', 'Nombre Completo', 'Género', 'Estado', 'Fecha Nac.']];

      autoTable(doc, {
        head: head,
        body: tableData,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [22, 163, 74] } // Verde FP
      });

      // Guardar el documento
      doc.save('Mis_Registros_Electorales.pdf');
      
      this.showToast('¡Reporte generado exitosamente!', 'success');
    } catch (e) {
      console.error(e);
      this.showToast('Error al generar el archivo PDF.', 'danger');
    } finally {
      this.isDownloading = false;
    }
  }

  async showToast(message: string, color: string) {
    const t = await this.toastCtrl.create({ message, duration: 3000, color, position: 'bottom' });
    t.present();
  }
}
