import { Component, inject } from '@angular/core';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonIcon, IonSpinner, FormsModule, CommonModule],
})
export class HomePage {
  loginData = { email: '', password: '' };
  toastMessage = '';
  isError = false;
  isLoading = false;
  showPassword = false;

  private http = inject(HttpClient);

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  forgotPassword() {
    // TODO: implementar recuperación de contraseña
    alert('Contacta al administrador del sistema.');
  }

  login() {
    if (!this.loginData.email || !this.loginData.password) {
      this.toastMessage = 'Por favor completa todos los campos';
      this.isError = true;
      return;
    }

    this.isLoading = true;
    this.toastMessage = '';

    this.http.post<any>('http://localhost:5144/api/auth/login', this.loginData).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.toastMessage = '¡Acceso exitoso! Redirigiendo...';
        this.isError = false;
        localStorage.setItem('token', res.token);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastMessage = err.error?.errors?.[0] || 'Credenciales incorrectas';
        this.isError = true;
      }
    });
  }
}
