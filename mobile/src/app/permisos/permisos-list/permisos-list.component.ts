import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
  IonIcon, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
  IonItemOption, IonSpinner, AlertController, ToastController, IonAccordionGroup, IonAccordion
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, keyOutline, trashOutline, cubeOutline } from 'ionicons/icons';
import { ModulosPermisosService, Permiso, Modulo } from '../../core/services/modulos-permisos.service';

@Component({
  selector: 'app-permisos-list',
  templateUrl: './permisos-list.component.html',
  styleUrls: ['./permisos-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
    IonIcon, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
    IonItemOption, IonSpinner, IonAccordionGroup, IonAccordion,
    CommonModule, RouterModule
  ]
})
export class PermisosListComponent implements OnInit {
  permisos: Permiso[] = [];
  modulos: Modulo[] = [];
  isLoading = false;

  private modulosService = inject(ModulosPermisosService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ addCircleOutline, keyOutline, trashOutline, cubeOutline });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    this.modulosService.getModulos().subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        this.modulosService.getPermisos().subscribe({
          next: (permisos) => {
            this.permisos = permisos;
            this.isLoading = false;
          },
          error: () => this.handleError()
        });
      },
      error: () => this.handleError()
    });
  }

  getPermisosByModulo(moduloId: number): Permiso[] {
    return this.permisos.filter(p => p.moduloId === moduloId);
  }

  getActionName(accion: number): string {
    const map: any = { 0: 'Read', 1: 'Create', 2: 'Update', 3: 'Delete', 4: 'Manage' };
    return map[accion] || 'Other';
  }

  async deletePermiso(permiso: Permiso) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Ocultar/Eliminar permiso: ${permiso.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: () => {
            this.modulosService.deletePermiso(permiso.id).subscribe({
              next: () => {
                this.permisos = this.permisos.filter(p => p.id !== permiso.id);
                this.showToast('Permiso eliminado', 'success');
              },
              error: () => this.showToast('Error al eliminar', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  handleError() {
    this.isLoading = false;
    this.showToast('Error cargando los datos', 'danger');
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom'
    });
    await toast.present();
  }
}
