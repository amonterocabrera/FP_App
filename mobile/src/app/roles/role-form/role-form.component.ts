import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner, ToastController,
  IonList, IonListHeader, IonCheckbox, IonAccordion, IonAccordionGroup, IonBadge
} from '@ionic/angular/standalone';
import { RolesService, Rol } from '../../core/services/roles.service';
import { ModulosPermisosService, Permiso, Modulo } from '../../core/services/modulos-permisos.service';
import { addIcons } from 'ionicons';
import { saveOutline, shieldCheckmarkOutline, listOutline, chevronDownOutline, personAddOutline, personOutline, documentTextOutline, keyOutline, calendarOutline, closeOutline, checkmarkOutline, cubeOutline, arrowForwardOutline } from 'ionicons/icons';

@Component({
  selector: 'app-role-form',
  templateUrl: './role-form.component.html',
  styleUrls: ['./role-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner,
    IonList, IonListHeader, IonCheckbox, IonAccordion, IonAccordionGroup, IonBadge,
    CommonModule, ReactiveFormsModule
  ]
})
export class RoleFormComponent implements OnInit {
  roleForm: FormGroup;
  isEditing = false;
  roleId: string | null = null;
  isLoading = false;
  isSaving = false;

  modulosConPermisos: { modulo: Modulo, permisos: Permiso[] }[] = [];
  selectedPermisoIds: Set<number> = new Set<number>();

  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private modulosService = inject(ModulosPermisosService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({ saveOutline, shieldCheckmarkOutline, listOutline, chevronDownOutline, personAddOutline, personOutline, documentTextOutline, keyOutline, calendarOutline, closeOutline, checkmarkOutline, cubeOutline, arrowForwardOutline });
    
    this.roleForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      descripcion: [''],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.roleId = this.route.snapshot.paramMap.get('id');
    this.loadModulosYPermisos().then(() => {
      if (this.roleId) {
        this.isEditing = true;
        this.loadRole(this.roleId);
      }
    });
  }

  async loadModulosYPermisos() {
    return new Promise<void>((resolve, reject) => {
      this.modulosService.getModulos(true).subscribe({
        next: (modulos) => {
          this.modulosService.getPermisos().subscribe({
            next: (permisos) => {
              this.modulosConPermisos = modulos.map(m => ({
                modulo: m,
                permisos: permisos.filter(p => p.moduloId === m.id && p.isActive)
              }));
              resolve();
            },
            error: (err) => reject(err)
          });
        },
        error: (err) => reject(err)
      });
    });
  }

  loadRole(id: string) {
    this.isLoading = true;
    this.rolesService.getRole(id).subscribe({
      next: (role) => {
        this.roleForm.patchValue({
          name: role.name,
          descripcion: role.descripcion,
          isActive: role.isActive
        });
        
        // Marcar permisos seleccionados
        if (role.permisos) {
          role.permisos.forEach((p: any) => {
            this.selectedPermisoIds.add(p.id);
          });
        }
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar datos del rol', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  togglePermission(permisoId: number) {
    if (this.selectedPermisoIds.has(permisoId)) {
      this.selectedPermisoIds.delete(permisoId);
    } else {
      this.selectedPermisoIds.add(permisoId);
    }
  }

  isPermissionSelected(permisoId: number): boolean {
    return this.selectedPermisoIds.has(permisoId);
  }

  cancel() {
    this.location.back();
  }

  save() {
    if (this.roleForm.invalid) {
      this.roleForm.markAllAsTouched();
      this.showToast('Por favor completa los campos correctamente', 'warning');
      return;
    }

    this.isSaving = true;
    const roleData: Rol = this.roleForm.value;

    if (this.isEditing && this.roleId) {
      this.rolesService.updateRole(this.roleId, roleData).subscribe({
        next: () => {
          this.guardarPermisos(this.roleId!);
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al actualizar rol', 'danger');
        }
      });
    } else {
      this.rolesService.createRole(roleData).subscribe({
        next: (createdRole) => {
          this.guardarPermisos(createdRole.id!);
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al crear rol', 'danger');
        }
      });
    }
  }

  guardarPermisos(roleId: string) {
    const permisosArray = Array.from(this.selectedPermisoIds);
    this.rolesService.assignPermisos(roleId, permisosArray).subscribe({
      next: () => {
        this.isSaving = false;
        this.showToast(this.isEditing ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente', 'success');
        this.location.back();
      },
      error: () => {
        this.isSaving = false;
        this.showToast('Rol guardado, pero hubo un error asignando permisos', 'warning');
      }
    });
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
