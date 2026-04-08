import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner, ToastController,
  IonList, IonListHeader, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { ModulosPermisosService, Modulo } from '../../core/services/modulos-permisos.service';
import { addIcons } from 'ionicons';
import { saveOutline, keyOutline, textOutline, codeSlashOutline, flagOutline, powerOutline, cubeOutline } from 'ionicons/icons';

@Component({
  selector: 'app-permiso-form',
  templateUrl: './permiso-form.component.html',
  styleUrls: ['./permiso-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner,
    IonList, IonListHeader, IonSelect, IonSelectOption,
    CommonModule, ReactiveFormsModule
  ]
})
export class PermisoFormComponent implements OnInit {
  permisoForm: FormGroup;
  isEditing = false;
  permisoId: number | null = null;
  isLoading = false;
  isSaving = false;
  modulos: Modulo[] = [];

  private fb = inject(FormBuilder);
  private modulosService = inject(ModulosPermisosService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toastCtrl = inject(ToastController);

  constructor() {
    addIcons({ saveOutline, keyOutline, textOutline, codeSlashOutline, flagOutline, powerOutline, cubeOutline });
    
    this.permisoForm = this.fb.group({
      moduloId: [null, [Validators.required]],
      nombre: ['', [Validators.required]],
      clave: ['', [Validators.required]],
      accion: [0, [Validators.required]],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.loadModulos();
  }

  loadModulos() {
    this.isLoading = true;
    this.modulosService.getModulos(true).subscribe({
      next: (modulos) => {
        this.modulos = modulos;
        this.checkEditMode();
      },
      error: () => {
        this.isLoading = false;
        this.showToast('Error cargando módulos', 'danger');
        this.location.back();
      }
    });
  }

  checkEditMode() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditing = true;
      this.permisoId = +idParam;
      this.loadPermiso(this.permisoId);
    } else {
      this.isLoading = false;
    }
  }

  loadPermiso(id: number) {
    this.modulosService.getPermiso(id).subscribe({
      next: (data) => {
        this.permisoForm.patchValue(data);
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar permiso', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  save() {
    if (this.permisoForm.invalid) {
      this.permisoForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const formData = this.permisoForm.value;

    if (this.isEditing && this.permisoId) {
      this.modulosService.updatePermiso(this.permisoId, formData).subscribe({
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
      this.modulosService.createPermiso(formData).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Creado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al crear. Verifica duplicidad de clave.', 'danger');
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
