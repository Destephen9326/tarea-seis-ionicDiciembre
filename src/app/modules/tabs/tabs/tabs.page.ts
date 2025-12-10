import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonHeader, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, card, person } from 'ionicons/icons';

@Component({
  selector:  'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [IonToolbar, IonHeader, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {

  constructor() {
    addIcons({ home, card, person });
  }

}