import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { addIcons } from 'ionicons';
import {
  personOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowForwardOutline,
  lockClosed,
  locationOutline,
  peopleOutline,
  calendarOutline
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

  private authService = inject(AuthService);
  private router = inject(Router);

  constructor() {
    addIcons({ personOutline, lockClosedOutline, eyeOutline, eyeOffOutline, arrowForwardOutline, lockClosed, locationOutline, peopleOutline, calendarOutline });
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

    this.authService.login({ 
      email: this.loginData.email, 
      password: this.loginData.password 
    }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.succeeded) {
          this.toastMessage = '¡Acceso exitoso! Redirigiendo...';
          this.isError = false;
          
          setTimeout(() => {
            if (res.mustChangePassword) {
              // Si debemos forzar el cambio de password, redireccionar a esa vista
              this.router.navigate(['/change-password'], { replaceUrl: true });
            } else {
              this.router.navigate(['/dashboard'], { replaceUrl: true });
            }
          }, 500);
        } else {
          // Failure but still 200 OK (e.g. lockout or incorrect credentials returned normally)
          this.toastMessage = res.errors?.[0] || 'Credenciales incorrectas';
          this.isError = true;
        }
      },
      error: (err) => {
        this.isLoading = false;
        // The backend returns 401 with { errors: [...] } format for wrong passwords and lockouts
        this.toastMessage = err.error?.errors?.[0] || err.error?.error || 'Credenciales incorrectas';
        this.isError = true;
      }
    });
  }
}
