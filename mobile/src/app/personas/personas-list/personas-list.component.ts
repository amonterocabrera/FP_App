import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
  IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
  IonItemOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, peopleOutline, mailOutline, callOutline, trashOutline } from 'ionicons/icons';
import { PersonasService, Persona } from '../../core/services/personas.service';

@Component({
  selector: 'app-personas-list',
  templateUrl: './personas-list.component.html',
  styleUrls: ['./personas-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
    IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
    IonItemOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
    CommonModule, RouterModule
  ]
})
export class PersonasListComponent implements OnInit {
  personas: Persona[] = [];
  isLoading = false;
  
  // Paginación
  pageNumber = 1;
  pageSize = 15;
  searchTerm = '';
  hasNextPage = false;

  private personasService = inject(PersonasService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ addCircleOutline, peopleOutline, mailOutline, callOutline, trashOutline });
  }

  ngOnInit() {
    this.loadPersonas();
  }

  ionViewWillEnter() {
    this.pageNumber = 1;
    this.personas = [];
    this.loadPersonas();
  }

  loadPersonas(event?: any) {
    if (!event) this.isLoading = true;
    
    this.personasService.getPersonas(this.pageNumber, this.pageSize, this.searchTerm).subscribe({
      next: (res) => {
        if (this.pageNumber === 1) {
          this.personas = res.data;
        } else {
          this.personas = [...this.personas, ...res.data];
        }
        this.hasNextPage = res.hasNextPage;
        this.isLoading = false;
        if (event) event.target.complete();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error al cargar personas', 'danger');
        if (event) event.target.complete();
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    this.pageNumber = 1;
    this.loadPersonas();
  }

  doRefresh(event: any) {
    this.pageNumber = 1;
    this.loadPersonas(event);
  }

  loadMore(event: any) {
    this.pageNumber++;
    this.loadPersonas(event);
  }

  async deletePersona(persona: Persona) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Eliminación',
      message: `¿Estás seguro de eliminar a ${persona.nombre} ${persona.apellido}? (Ocultamiento lógico)`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { 
          text: 'Eliminar', 
          role: 'destructive',
          handler: () => {
            this.personasService.deletePersona(persona.id!).subscribe({
              next: () => {
                this.personas = this.personas.filter(p => p.id !== persona.id);
                this.showToast('Persona eliminada exitosamente', 'success');
              },
              error: () => this.showToast('Error al eliminar persona', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom'
    });
    await toast.present();
  }
}
