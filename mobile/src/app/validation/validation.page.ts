import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content class="ion-padding" style="--background: #f4f5f8;">
      <div class="validation-container">
        <!-- Mockup: Top Header Forest Green -->
        <div class="header">
          <div class="logo">FP</div>
          <h2>GESTIÓN ELECTORAL</h2>
        </div>

        <div class="card">
          <div class="progress-bar">
            <span>PASO 1 DE 2</span>
            <span>Identidad</span>
          </div>
          <div class="progress" style="width: 100%; height: 6px; background-color: #e0e0e0; border-radius: 3px; margin: 10px 0 20px;">
             <div style="width: 50%; height: 100%; background-color: #0b8c56; border-radius: 3px;"></div>
          </div>

          <p class="instruction">Para validar su identidad, por favor capture o suba una foto nítida del frente de su Cédula de Identidad y Electoral.</p>

          <div class="upload-area" (click)="fileInput.click()">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" style="display: none;">
            <ion-icon name="camera-outline" style="font-size: 40px; color: #0b8c56;"></ion-icon>
            <p><strong>Subir Cédula (Frente)</strong></p>
            <p style="color: #888; font-size: 0.9em;">Toque o arrastre su foto aquí</p>
            <p *ngIf="selectedFile" style="margin-top: 10px; color: #0b8c56;">✓ {{ selectedFile.name }}</p>
          </div>

          <div class="input-field">
            <ion-icon name="person-outline"></ion-icon>
            <span>Nombre: {{ user?.nombre }} {{ user?.apellido }}</span>
          </div>

          <ion-button expand="block" shape="round" color="success" class="verify-btn" (click)="verifyIdentity()" [disabled]="!selectedFile">
            VERIFICAR IDENTIDAD
          </ion-button>
        </div>

        <div class="badges">
          <span class="badge">60+ Recintos</span>
          <span class="badge">7M+ Miembros</span>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .validation-container { display: flex; flex-direction: column; align-items: center; min-height: 100vh; background: #0b2e1e; padding-top: 40px; }
    .header { color: white; text-align: center; margin-bottom: 25px; }
    .header h2 { margin: 5px 0; font-weight: bold; font-size: 1.2rem; }
    .logo { width: 50px; height: 50px; background: white; color: #0b2e1e; display: inline-flex; justify-content: center; align-items: center; border-radius: 8px; font-weight: bold; font-size: 1.5rem; }
    .card { background: white; border-radius: 30px; width: 90%; max-width: 400px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
    .progress-bar { display: flex; justify-content: space-between; font-weight: bold; font-size: 0.9em; color: #333; }
    .instruction { font-size: 0.95em; color: #555; text-align: center; margin-bottom: 20px; }
    .upload-area { border: 2px dashed #0b8c56; border-radius: 15px; padding: 30px 10px; text-align: center; background: #f0fdf4; cursor: pointer; margin-bottom: 20px; transition: 0.3s; }
    .upload-area:active { background: #dcfce7; }
    .input-field { background: #f3f4f6; border-radius: 50px; padding: 15px; display: flex; align-items: center; margin-bottom: 15px; font-size: 0.9em; color: #555; }
    .input-field ion-icon { margin-right: 10px; font-size: 1.2em; color: #0b8c56; }
    .verify-btn { --background: #0b8c56; margin-top: 10px; height: 50px; font-weight: bold; }
    .badges { margin-top: 25px; display: flex; gap: 10px; }
    .badge { background: rgba(255,255,255,0.2); color: white; padding: 8px 15px; border-radius: 20px; font-size: 0.85em; font-weight: bold; }
  `]
})
export class ValidationPage {
  selectedFile: File | null = null;
  user: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    this.user = this.authService.getCurrentUser();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async verifyIdentity() {
    if (!this.selectedFile) return;

    const loading = await this.loadingCtrl.create({
      message: 'Verificando con plataforma de seguridad...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.verifyIdentityDocument(this.selectedFile).subscribe({
      next: (res) => {
        loading.dismiss();
        this.showToast('Identificación aprobada exitosamente', 'success');
        
        // Actualizamos LocalStorage con el nuevo estado
        if (this.user) {
          this.user.identityValidationStatus = 2; // Approved
          // Aquí se idealmente se usaría TokenStorageService para guardar user.
          localStorage.setItem('auth-user', JSON.stringify(this.user));
        }
        
        // Redirigir al inicio del sistema
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: (err) => {
        loading.dismiss();
        const msg = err.error?.message || 'Error al validar documento';
        this.showToast(msg, 'danger');
        
        if (this.user) {
          this.user.identityValidationStatus = 3; // Rejected
          localStorage.setItem('auth-user', JSON.stringify(this.user));
        }
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 3500,
      position: 'top'
    });
    toast.present();
  }
}
