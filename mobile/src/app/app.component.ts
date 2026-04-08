import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { 
  IonApp, IonRouterOutlet, IonSplitPane, IonMenu, IonContent, IonList, 
  IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel,
  IonHeader, IonToolbar, IonTitle, IonAvatar, IonButton,
  MenuController
} from '@ionic/angular/standalone';
import { AuthService } from './core/services/auth.service';
import { addIcons } from 'ionicons';
import { 
  homeOutline, peopleOutline, shieldCheckmarkOutline, cubeOutline, 
  logOutOutline, personCircleOutline, locationOutline, clipboardOutline, gridOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    IonApp, IonRouterOutlet, IonSplitPane, IonMenu, IonContent, IonList, 
    IonListHeader, IonNote, IonMenuToggle, IonItem, IonIcon, IonLabel,
    IonHeader, IonToolbar, IonTitle, IonAvatar, IonButton,
    CommonModule, RouterLink, RouterLinkActive
  ],
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  constructor() {
    addIcons({ 
      homeOutline, peopleOutline, shieldCheckmarkOutline, cubeOutline, 
      logOutOutline, personCircleOutline, locationOutline, clipboardOutline, gridOutline 
    });
  }

  get isLoggedIn(): boolean {
    return this.authService.isAuthenticated();
  }

  private _cachedUser: any = null;
  private _lastCheck: number = 0;

  get currentUser() {
    // Only fetch from localStorage at most once per 2 seconds to avoid JSON.parse infinite loops in getters
    const now = Date.now();
    if (!this._cachedUser || (now - this._lastCheck > 2000)) {
      this._cachedUser = this.authService.getCurrentUser();
      this._lastCheck = now;
    }
    return this._cachedUser;
  }

  get modulos() {
    return this.currentUser?.modulos || [];
  }

  get fallbackIcon() {
    return 'cube-outline';
  }

  get isHomePage(): boolean {
    return this.router.url === '/home' || this.router.url === '/';
  }

  async logout() {
    this.authService.logout();
    this._cachedUser = null;
    await this.menuCtrl.close();
    this.router.navigate(['/home']);
  }
}
