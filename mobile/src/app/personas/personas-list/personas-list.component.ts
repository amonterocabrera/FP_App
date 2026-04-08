import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
  IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
  IonItemOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
  AlertController, ToastController, IonAvatar, IonSkeletonText, IonFab, IonFabButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, peopleOutline, mailOutline, callOutline, trashOutline, personAddOutline, pencilOutline, addOutline, searchOutline, closeOutline, arrowBackOutline } from 'ionicons/icons';
import { PersonasService, Persona } from '../../core/services/personas.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-personas-list',
  templateUrl: './personas-list.component.html',
  styleUrls: ['./personas-list.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonButton,
    IonIcon, IonSearchbar, IonList, IonItemSliding, IonItem, IonLabel, IonBadge, IonItemOptions,
    IonItemOption, IonRefresher, IonRefresherContent, IonInfiniteScroll, IonInfiniteScrollContent,
    IonAvatar, IonSkeletonText, IonFab, IonFabButton, CommonModule, RouterModule
  ]
})
export class PersonasListComponent implements OnInit {
  @ViewChild('searchBar', { static: false }) searchBar!: IonSearchbar;
  
  personas: Persona[] = [];
  isLoading = false;
  showSearch = false;
  
  // Paginación
  pageNumber = 1;
  pageSize = 15;
  searchTerm = '';
  hasNextPage = false;

  private personasService = inject(PersonasService);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ addCircleOutline, peopleOutline, mailOutline, callOutline, trashOutline, personAddOutline, pencilOutline, addOutline, searchOutline, closeOutline, arrowBackOutline });
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
    
    this.personasService.getPersonas(this.searchTerm, this.pageNumber, this.pageSize).subscribe({
      next: (res) => {
        if (this.pageNumber === 1) {
          this.personas = res.items;
        } else {
          this.personas = [...this.personas, ...res.items];
        }
        this.hasNextPage = (this.pageNumber * this.pageSize) < res.total;
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

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (this.showSearch) {
      setTimeout(() => {
        this.searchBar?.setFocus();
      }, 150); // Pequeño delay de animación
    } else {
      if (this.searchTerm !== '') {
        this.searchTerm = '';
        this.pageNumber = 1;
        this.loadPersonas();
      }
    }
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

  getFotoUrl(cedula: string): string {
    return `${environment.apiUrl}/personas/${cedula}/foto`;
  }

  handleImageError(event: any) {
    const imgElement = event.target;
    imgElement.style.display = 'none';
    
    // El siguiente elemento debería ser el ng-template (invisible) 
    // y el subsiguiente el div .fallback-manual
    const parent = imgElement.parentElement;
    const fallbackManual = parent.querySelector('.fallback-manual');
    if (fallbackManual) {
      fallbackManual.style.display = 'flex';
    }
  }
}
