import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { AuthService } from '../core/services/auth.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  homeOutline, barChartOutline, peopleOutline,
  personCircleOutline, cameraOutline, personOutline,
  idCardOutline, checkmarkCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-validation',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <!-- Inputs ocultos siempre presentes para que las referencias funcionen -->
    <input #frontInput type="file" (change)="onFrontSelected($event)" accept="image/*" style="display:none; position:fixed; top:-999px;">
    <input #backInput  type="file" (change)="onBackSelected($event)"  accept="image/*" style="display:none; position:fixed; top:-999px;">

    <ion-content style="--background: #f0f2f5; --overflow: auto;">

      <!-- ══ HEADER: mismo logo del login ════════════════════════════════════ -->
      <div class="fp-header">
        <div class="fp-header__logo-row">
          <img src="assets/fp-logo.png" alt="Fuerza del Pueblo" class="fp-header__img" />
          <div class="fp-header__divider"></div>
          <div class="fp-header__brand">
            <span class="fp-brand-title">FUERZA</span>
            <span class="fp-brand-title">DEL PUEBLO</span>
          </div>
        </div>
        <p class="fp-header__subtitle">GESTIÓN ELECTORAL</p>
      </div>

      <!-- ══ CARD PRINCIPAL ════════════════════════════════════════════════  -->
      <div class="fp-card">

        <h1 class="fp-card__title">VERIFICACIÓN DE IDENTIDAD</h1>

        <!-- ── Info del usuario ─────────────────────────────────────────── -->
        <div class="fp-user-row">
          <div class="fp-chip">
            <ion-icon name="id-card-outline"></ion-icon>
            <span>{{ user?.cedula || '···-·······-·' }}</span>
          </div>
          <div class="fp-chip">
            <ion-icon name="person-outline"></ion-icon>
            <span>{{ (user?.nombre || 'Usuario') + ' ' + (user?.apellido || '') | uppercase }}</span>
          </div>
        </div>

        <!-- ══ ÚNICO PASO: FRENTE ═══════════════════════ -->
        <div class="fp-step" [class.fp-step--done]="frontFile">
          <div class="fp-step__header">
            <span class="fp-step__label">SUBIR CÉDULA</span>
            <ion-icon *ngIf="frontFile" name="checkmark-circle-outline" class="fp-step__check"></ion-icon>
          </div>

          <!-- Placeholder: imagen real de la cédula (FRENTE) -->
          <div class="fp-id-frame fp-id-frame--active" (click)="frontInput.click()">
            <!-- Si ya subió el frente, mostrar SU imagen; si no, el placeholder -->
            <img *ngIf="frontPreview" [src]="frontPreview" class="fp-cedula-img" alt="Frente cargado" />
            <img *ngIf="!frontPreview" src="assets/cedula-frente.png" class="fp-cedula-img fp-cedula-img--placeholder" alt="Frente de la cédula" />
            <!-- Guía de cámara -->
            <div class="fp-camera-guide">
              <span class="corner tl"></span>
              <span class="corner tr"></span>
              <span class="corner bl"></span>
              <span class="corner br"></span>
            </div>
            <!-- Overlay de "Tap para reemplazar" si ya hay foto -->
            <div *ngIf="frontPreview" class="fp-replace-overlay">
              <ion-icon name="camera-outline"></ion-icon>
              <span>Tocar para reemplazar</span>
            </div>
          </div>

          <!-- Botón Subir Frente -->
          <button class="fp-upload-btn fp-upload-btn--active" (click)="frontInput.click()">
            <ion-icon name="camera-outline"></ion-icon>
            <span>{{ frontFile ? '✓ FRENTE CARGADO' : '→ SUBIR FRENTE' }}</span>
          </button>
          <p class="fp-hint">Por favor, sube una foto nítida del <strong>FRENTE</strong> de tu cédula</p>
        </div>

        </div>

        <!-- ══ BOTÓN VERIFICAR ════════════════════════════════════════════ -->
        <button class="fp-verify-btn" [disabled]="!frontFile" (click)="verifyIdentity()">
          → ENVIAR PARA VALIDAR
        </button>

      </div>
      <!-- /card -->

    </ion-content>

    <!-- ══ FOOTER: Tab-bar deshabilitado ═════════════════════════════════ -->
    <ion-footer class="ion-no-border">
      <ion-tab-bar class="fp-footer-tabs" style="opacity: 0.45; pointer-events: none;">
        <ion-tab-button layout="icon-top">
          <ion-icon name="home-outline"></ion-icon>
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button layout="icon-top">
          <ion-icon name="bar-chart-outline"></ion-icon>
          <ion-label>Reportes</ion-label>
        </ion-tab-button>
        <ion-tab-button layout="icon-top">
          <ion-icon name="people-outline"></ion-icon>
          <ion-label>Personas</ion-label>
        </ion-tab-button>
        <ion-tab-button layout="icon-top">
          <ion-icon name="person-circle-outline"></ion-icon>
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-footer>
  `,
  styles: [`
    /* ── Header ─────────────────────────────────────────────────────── */
    .fp-header {
      background: linear-gradient(160deg, #0b3d24 0%, #0d5230 100%);
      padding: 48px 24px 36px;
      text-align: center;
      border-bottom-left-radius: 32px;
      border-bottom-right-radius: 32px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      margin-bottom: -16px;
    }
    .fp-header__logo-row {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      margin-bottom: 8px;
    }
    .fp-header__img {
      width: 56px; height: 56px;
      object-fit: contain;
    }
    .fp-header__divider {
      width: 2px; height: 44px;
      background: rgba(255,255,255,0.35);
    }
    .fp-header__brand {
      display: flex; flex-direction: column; align-items: flex-start;
    }
    .fp-brand-title {
      font-size: 1.25rem; font-weight: 900; color: white;
      line-height: 1.15; letter-spacing: 0.5px; font-style: italic;
    }
    .fp-header__subtitle {
      color: rgba(255,255,255,0.85); font-size: 0.85rem;
      letter-spacing: 3px; font-weight: 400; margin: 4px 0 0;
    }

    /* ── Card ─────────────────────────────────────────────────────────── */
    .fp-card {
      background: white;
      border-radius: 30px;
      margin: 0 16px 24px;
      padding: 28px 22px 22px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.12);
      position: relative;
      z-index: 1;
    }
    .fp-card__title {
      font-size: 1.3rem; font-weight: 900; color: #111;
      text-align: center; margin: 0 0 18px; letter-spacing: 0.3px;
    }

    /* ── Chips usuario ────────────────────────────────────────────────── */
    .fp-user-row {
      display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px;
    }
    .fp-chip {
      display: flex; align-items: center; gap: 10px;
      background: #f1f5f9; border-radius: 50px;
      padding: 11px 18px; font-size: 0.9rem; color: #334155;
    }
    .fp-chip ion-icon { color: #0b8c56; font-size: 1.2rem; }

    /* ── Step ─────────────────────────────────────────────────────────── */
    .fp-step { margin-bottom: 22px; }
    .fp-step--locked .fp-upload-btn { opacity: 0.45; }
    .fp-step__header {
      display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
    }
    .fp-step__badge {
      background: #ddd; color: #888;
      padding: 4px 12px; border-radius: 30px;
      font-size: 0.75rem; font-weight: 700; white-space: nowrap;
    }
    .fp-step__badge--active { background: #0b8c56; color: white; }
    .fp-step__label {
      font-size: 0.95rem; font-weight: 800; color: #1a1a1a; letter-spacing: 0.2px;
    }
    .fp-step__label--grey { color: #aaa; }
    .fp-step__check { color: #0b8c56; font-size: 1.3rem; margin-left: auto; }

    /* ── ID Frame ─────────────────────────────────────────────────────── */
    .fp-id-frame {
      position: relative; border-radius: 16px; overflow: hidden;
      margin-bottom: 14px; cursor: pointer;
      background: #f8faf9;
    }
    .fp-id-frame--active { border: 2px dashed rgba(11,140,86,0.5); }
    .fp-id-frame--locked {
      border: 2px dashed #ddd; min-height: 120px;
      display: flex; align-items: center; justify-content: center;
    }
    .fp-lock-overlay { text-align: center; padding: 24px; }

    /* Guía de cámara: esquinas */
    .fp-camera-guide {
      position: absolute; inset: 8px; pointer-events: none;
    }
    .corner {
      position: absolute; width: 20px; height: 20px;
      border-color: #0b8c56; border-style: solid;
    }
    .tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 3px 0 0 0; }
    .tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 3px 0 0; }
    .bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 3px; }
    .br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 3px 0; }

    /* -- Imagenes reales de la cedula --------------------------------- */
    .fp-cedula-img {
      width: 100%; display: block;
      border-radius: 10px;
      box-shadow: 0 3px 12px rgba(0,0,0,0.15);
    }
    .fp-cedula-img--placeholder {
      opacity: 0.65;
      filter: grayscale(15%);
    }
    .fp-replace-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.38);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 6px;
      color: white; font-size: 0.8rem; font-weight: 600;
      border-radius: 14px;
      opacity: 0; transition: opacity 0.2s ease;
    }
    .fp-id-frame:active .fp-replace-overlay,
    .fp-id-frame:hover .fp-replace-overlay { opacity: 1; }
    .fp-replace-overlay ion-icon { font-size: 1.5rem; }


    /* ── Botones ─────────────────────────────────────────────────────── */
    .fp-upload-btn {
      width: 100%; padding: 14px; border-radius: 50px;
      font-size: 0.95rem; font-weight: 700; letter-spacing: 0.5px;
      display: flex; align-items: center; justify-content: center; gap: 10px;
      cursor: pointer; border: none; outline: none;
      background: #e8e8e8; color: #aaa;
      transition: all 0.25s ease;
    }
    .fp-upload-btn--active {
      background: linear-gradient(135deg, #0b8c56, #086b42);
      color: white;
      box-shadow: 0 6px 18px rgba(11,140,86,0.35);
    }
    .fp-upload-btn--done {
      background: #e8f7ee; color: #0b8c56;
      border: 2px solid #0b8c56;
    }
    .fp-upload-btn ion-icon { font-size: 1.2rem; }

    .fp-hint {
      text-align: center; font-size: 0.85rem; color: #64748b;
      margin: 10px 0 0; line-height: 1.5;
    }

    .fp-verify-btn {
      width: 100%; padding: 16px; border-radius: 50px;
      background: linear-gradient(135deg, #0b8c56, #065e39);
      color: white; font-size: 1rem; font-weight: 800;
      letter-spacing: 0.5px; border: none; cursor: pointer;
      margin-top: 8px;
      box-shadow: 0 8px 24px rgba(11,140,86,0.4);
      transition: all 0.25s ease;
    }
    .fp-verify-btn:disabled {
      background: #c8d8cf; color: #fff;
      box-shadow: none; cursor: not-allowed;
    }

    /* ── Footer Tabs ─────────────────────────────────────────────────── */
    .fp-footer-tabs {
      --background: white;
      border-top: 1px solid #e8e8e8;
      padding-bottom: env(safe-area-inset-bottom);
    }
  `]
})
export class ValidationPage {
  frontFile: File | null = null;
  frontPreview: string | null = null;
  user: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {
    addIcons({
      homeOutline, barChartOutline, peopleOutline,
      personCircleOutline, cameraOutline, personOutline,
      idCardOutline, checkmarkCircleOutline
    });
    this.user = this.authService.getCurrentUser();
  }

  onFrontSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.frontFile = file;
      this.frontPreview = URL.createObjectURL(file);
    }
  }

  async verifyIdentity() {
    if (!this.frontFile) return;

    const loading = await this.loadingCtrl.create({
      message: 'Verificando con plataforma de seguridad...',
      spinner: 'crescent'
    });
    await loading.present();

    this.authService.verifyIdentityDocument(this.frontFile).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('¡Identidad verificada exitosamente!', 'success');
        if (this.user) {
          this.user.identityValidationStatus = 2;
          localStorage.setItem('auth-user', JSON.stringify(this.user));
        }
        this.router.navigateByUrl('/dashboard', { replaceUrl: true });
      },
      error: (err) => {
        loading.dismiss();
        const msg = err.error?.message || 'Error al validar documento. Intente de nuevo.';
        this.showToast(msg, 'danger');
        if (this.user) {
          this.user.identityValidationStatus = 3;
          localStorage.setItem('auth-user', JSON.stringify(this.user));
        }
      }
    });
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, color, duration: 3500, position: 'top'
    });
    toast.present();
  }
}
