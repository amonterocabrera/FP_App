import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline, barChartOutline, personAddOutline,
  gridOutline, personCircleOutline, peopleOutline
} from 'ionicons/icons';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonBadge,
    RouterLink, RouterLinkActive
  ],
})
export class TabsPage {
  constructor(public authSvc: AuthService) {
    addIcons({
      homeOutline, barChartOutline, personAddOutline,
      gridOutline, personCircleOutline, peopleOutline
    });
  }

  get userId(): string | undefined {
    return this.authSvc.getCurrentUser()?.id;
  }
}
