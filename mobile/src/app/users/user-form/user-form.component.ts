import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner, ToastController 
} from '@ionic/angular/standalone';
import { UserService, User } from '../../services/user.service';
import { addIcons } from 'ionicons';
import { saveOutline, personOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss'],
  standalone: true,
  imports: [
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonBackButton,
    IonItem, IonLabel, IonInput, IonButton, IonIcon, IonToggle, IonSpinner,
    CommonModule, ReactiveFormsModule
  ]
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditing = false;
  userId: string | null = null;
  isLoading = false;
  isSaving = false;

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private toastController = inject(ToastController);

  constructor() {
    addIcons({ saveOutline, personOutline, mailOutline, lockClosedOutline });
    
    this.userForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      isActive: [true],
      password: ['']
    });
  }

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id');
    
    if (this.userId) {
      this.isEditing = true;
      this.userForm.get('email')?.disable(); // Backend update doesn't take email
      this.userForm.get('password')?.disable(); // Password update is done separately
      this.loadUser(this.userId);
    } else {
      // Si es nuevo usuario, obligar contraseña 8 chars
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUser(id: string) {
    this.isLoading = true;
    this.userService.getUser(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          isActive: user.isActive
        });
        this.isLoading = false;
      },
      error: () => {
        this.showToast('Error al cargar datos del usuario', 'danger');
        this.isLoading = false;
        this.location.back();
      }
    });
  }

  save() {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.showToast('Por favor completa los campos correctamente', 'warning');
      return;
    }

    this.isSaving = true;
    const userData = this.userForm.getRawValue();

    if (this.isEditing && this.userId) {
      const updateData = {
        nombre: userData.nombre,
        apellido: userData.apellido,
        isActive: userData.isActive,
        telefono: null,
        personaId: null
      };
      
      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Usuario actualizado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al actualizar usuario', 'danger');
        }
      });
    } else {
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.isSaving = false;
          this.showToast('Usuario creado exitosamente', 'success');
          this.location.back();
        },
        error: () => {
          this.isSaving = false;
          this.showToast('Error al crear usuario', 'danger');
        }
      });
    }
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
