import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
  IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
  IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, ToastController, AlertController,
  IonSearchbar, IonRefresher, IonRefresherContent, IonMenuButton
} from '@ionic/angular/standalone';
import { UserService, User } from '../../services/user.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, create, personCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton, 
    IonList, IonItem, IonLabel, IonItemSliding, IonItemOption, IonItemOptions, 
    IonFab, IonFabButton, IonIcon, IonAvatar, IonSkeletonText, IonSearchbar,
    IonRefresher, IonRefresherContent, IonMenuButton,
    CommonModule, FormsModule
  ]
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  searchTerm = '';

  private userService = inject(UserService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({ add, trash, create, personCircleOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.loadUsers();
  }

  loadUsers(event?: any) {
    if (!event) this.isLoading = true;
    this.userService.getUsers(this.searchTerm, undefined, 1, 50).subscribe({
      next: (res) => {
        this.users = res.items;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: (err) => {
        this.isLoading = false;
        if (event) event.target.complete();
        this.showToast('Error al cargar usuarios', 'danger');
      }
    });
  }

  onSearchChange(event: any) {
    this.searchTerm = event.detail.value;
    this.loadUsers();
  }

  navigateToAdd() {
    this.router.navigate(['/users/new']);
  }

  navigateToEdit(user: User) {
    this.router.navigate(['/users/edit', user.id]);
  }

  async confirmDelete(user: User) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar a ${user.nombre} ${user.apellido}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        }, {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
             if(user.id) this.deleteUser(user.id);
          }
        }
      ]
    });
    await alert.present();
  }

  deleteUser(id: string) {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.showToast('Usuario eliminado con éxito', 'success');
        this.loadUsers(); // refresh
      },
      error: () => this.showToast('Error al eliminar usuario', 'danger')
    });
  }

  async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
