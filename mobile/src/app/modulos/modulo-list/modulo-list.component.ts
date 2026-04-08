import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
  IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, ToastController, AlertController,
  IonSearchbar, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';
import { ModulosPermisosService, Modulo } from '../../core/services/modulos-permisos.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, cubeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-modulo-list',
  templateUrl: './modulo-list.component.html',
  styleUrls: ['./modulo-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, 
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
    IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, IonSearchbar,
    IonRefresher, IonRefresherContent,
    CommonModule, FormsModule
  ]
})
export class ModuloListComponent implements OnInit {
  modulos: Modulo[] = [];
  filteredModulos: Modulo[] = [];
  isLoading = true;
  searchTerm = '';

  private modulosService = inject(ModulosPermisosService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ add, trash, create, cubeOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadModulos();
  }

  loadModulos(event?: any) {
    if (!event) this.isLoading = true;
    this.modulosService.getModulos(false).subscribe({
      next: (data) => {
        this.modulos = data;
        this.filterModulos();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.showToast('Error al cargar módulos', 'danger');
      }
    });
  }

  filterModulos() {
    if (!this.searchTerm) {
      this.filteredModulos = this.modulos;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredModulos = this.modulos.filter(m => 
        (m.nombre && m.nombre.toLowerCase().includes(term)) ||
        (m.ruta && m.ruta.toLowerCase().includes(term))
      );
    }
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterModulos();
  }

  navigateToAdd() {
    this.router.navigate(['/modulos/new']);
  }

  navigateToEdit(modulo: Modulo) {
    this.router.navigate(['/modulos/edit', modulo.id]);
  }

  async confirmDelete(modulo: Modulo) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el módulo ${modulo.nombre}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' }, 
        { text: 'Eliminar', role: 'destructive', handler: () => { if(modulo.id) this.deleteModulo(modulo.id); } }
      ]
    });
    await alert.present();
  }

  deleteModulo(id: number) {
    this.modulosService.deleteModulo(id).subscribe({
      next: () => {
        this.showToast('Módulo eliminado', 'success');
        this.loadModulos();
      },
      error: () => this.showToast('Error al eliminar', 'danger')
    });
  }

  async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message, duration: 2000, color, position: 'bottom'
    });
    await toast.present();
  }
}
