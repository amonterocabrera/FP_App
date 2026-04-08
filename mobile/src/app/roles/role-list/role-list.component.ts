import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonMenuButton,
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
  IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, ToastController, AlertController,
  IonSearchbar, IonRefresher, IonRefresherContent, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, trash, shieldCheckmarkOutline, constructOutline } from 'ionicons/icons';
import { RolesService, Rol } from '../../core/services/roles.service';

@Component({
  selector: 'app-role-list',
  templateUrl: './role-list.component.html',
  styleUrls: ['./role-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, IonMenuButton,
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
    IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, IonSearchbar,
    IonRefresher, IonRefresherContent, IonBadge, CommonModule, FormsModule
  ]
})
export class RoleListComponent implements OnInit {
  roles: Rol[] = [];
  filteredRoles: Rol[] = [];
  isLoading = true;
  searchTerm = '';

  private rolesService = inject(RolesService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ add, trash, shieldCheckmarkOutline, constructOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.loadRoles();
  }

  loadRoles(event?: any) {
    if (!event) this.isLoading = true;
    this.rolesService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.filterRoles();
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.showToast('Error al cargar roles', 'danger');
      }
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.filterRoles();
  }

  filterRoles() {
    if (!this.searchTerm) {
      this.filteredRoles = [...this.roles];
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.filteredRoles = this.roles.filter(r => 
      r.name.toLowerCase().includes(term) || 
      (r.descripcion && r.descripcion.toLowerCase().includes(term))
    );
  }

  navigateToAdd() {
    this.router.navigate(['/roles/new']);
  }

  navigateToEdit(role: Rol) {
    this.router.navigate(['/roles/edit', role.id]);
  }

  async confirmDelete(role: Rol) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el rol ${role.name}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel', cssClass: 'secondary' }, 
        { text: 'Eliminar', role: 'destructive',
          handler: () => {
             if(role.id) this.deleteRole(role.id);
          }
        }
      ]
    });
    await alert.present();
  }

  deleteRole(id: string) {
    this.rolesService.deleteRole(id).subscribe({
      next: () => {
        this.showToast('Rol eliminado con éxito', 'success');
        this.loadRoles(); // refresh
      },
      error: () => this.showToast('Error al eliminar rol', 'danger')
    });
  }

  async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
