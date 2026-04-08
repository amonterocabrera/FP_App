import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner, ToastController,
  IonList, IonListHeader, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton, IonModal
} from '@ionic/angular/standalone';
import { PersonasService, Persona } from '../../core/services/personas.service';
import { addIcons } from 'ionicons';
import { saveOutline, idCardOutline, fingerPrintOutline, personOutline, calendarOutline, maleFemaleOutline, callOutline, mailOutline, mapOutline, powerOutline } from 'ionicons/icons';

@Component({
  selector: 'app-persona-form',
  templateUrl: './persona-form.component.html',
  styleUrls: ['./persona-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner,
    IonList, IonListHeader, IonSelect, IonSelectOption, IonDatetime, IonDatetimeButton, IonModal,
    CommonModule, ReactiveFormsModule
  ]
})
export class PersonaFormComponent implements OnInit {
  personaForm: FormGroup;
  isEditing = false;
  personaId: string | null = null;
  isLoading = false;
  isSaving = false;

  private fb = inject(FormBuilder);
  private personasService = inject(PersonasService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ saveOutline, idCardOutline, fingerPrintOutline, personOutline, calendarOutline, maleFemaleOutline, callOutline, mailOutline, mapOutline, powerOutline });
    
    this.personaForm = this.fb.group({
      cedula: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      fechaNacimiento: [new Date().toISOString(), [Validators.required]],
      genero: ['O', [Validators.required]],
      telefono: [''],
      email: ['', [Validators.email]],
      direccion: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.personaId = this.route.snapshot.paramMap.get('id');
    if (this.personaId) {
      this.isEditing = true;
      this.loadPersona(this.personaId);
    }
  }

  loadPersona(id: string) {
    this.isLoading = true;
    this.personasService.getPersona(id).subscribe({
      next: (data) => {
        // Adjust date format if necessary
        this.personaForm.patchValue({
          ...data,
          fechaNacimiento: new Date(data.fechaNacimiento).toISOString()
        });
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar datos', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  save() {
    if (this.personaForm.invalid) {
      this.personaForm.markAllAsTouched();
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.isSaving = true;
    const formData = this.personaForm.value;

    if (this.isEditing && this.personaId) {
      this.personasService.updatePersona(this.personaId, formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Actualizado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al actualizar', 'danger');
        }
      });
    } else {
      this.personasService.createPersona(formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Creado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al crear persona. Verifica que la cédula no esté duplicada.', 'danger');
        }
      });
    }
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message, duration: 2500, color, position: 'bottom'
    });
    await toast.present();
  }
}
