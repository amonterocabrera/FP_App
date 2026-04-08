import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner, ToastController
} from '@ionic/angular/standalone';
import { ModulosPermisosService, Modulo } from '../../core/services/modulos-permisos.service';
import { addIcons } from 'ionicons';
import { cubeOutline, textOutline, linkOutline, listOutline, imageOutline, arrowForwardOutline, closeOutline, keyOutline } from 'ionicons/icons';

@Component({
  selector: 'app-modulo-form',
  templateUrl: './modulo-form.component.html',
  styleUrls: ['./modulo-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner,
    CommonModule, ReactiveFormsModule
  ]
})
export class ModuloFormComponent implements OnInit {
  moduloForm: FormGroup;
  isEditing = false;
  moduloId: string | null = null;
  isLoading = false;
  isSaving = false;

  private fb = inject(FormBuilder);
  private modulosService = inject(ModulosPermisosService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({ cubeOutline, textOutline, linkOutline, listOutline, imageOutline, arrowForwardOutline, closeOutline, keyOutline });
    
    this.moduloForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      ruta: ['', Validators.required],
      orden: [0, Validators.required],
      icono: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.moduloId = this.route.snapshot.paramMap.get('id');
    if (this.moduloId) {
      this.isEditing = true;
      this.loadModulo(Number(this.moduloId));
    }
  }

  loadModulo(id: number) {
    this.isLoading = true;
    this.modulosService.getModulos(false).subscribe({
      next: (modulos) => {
        const modulo = modulos.find(m => m.id === id);
        if (modulo) {
          this.moduloForm.patchValue({
            nombre: modulo.nombre,
            ruta: modulo.ruta,
            orden: modulo.orden,
            icono: modulo.icono,
            isActive: modulo.isActive
          });
        } else {
          this.showToast('Módulo no encontrado', 'danger');
          this.location.back();
        }
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar datos', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  cancel() {
    this.location.back();
  }

  save() {
    if (this.moduloForm.invalid) {
      this.moduloForm.markAllAsTouched();
      this.showToast('Por favor completa los campos', 'warning');
      return;
    }

    this.isSaving = true;
    const data: Modulo = this.moduloForm.value;

    if (this.isEditing && this.moduloId) {
      data.id = Number(this.moduloId);
      this.modulosService.updateModulo(data.id, data).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Módulo actualizado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al actualizar', 'danger');
        }
      });
    } else {
      this.modulosService.createModulo(data).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Módulo creado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al crear', 'danger');
        }
      });
    }
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message, duration: 2500, color, position: 'bottom'
    });
    await toast.present();
  }
}
