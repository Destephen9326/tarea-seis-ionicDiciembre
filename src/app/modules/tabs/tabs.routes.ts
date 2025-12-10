// 

import { Routes } from '@angular/router';

export const tabsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/pages/home-page/home-page.page').then(m => m.HomePagePage)
      },
      {
        path: 'cards',
        loadComponent: () => import('../cards/pages/cards-page/cards-page.page').then(m => m.CardsPagePage)
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/pages/profile-page/profile-page.page').then(m => m.ProfilePagePage)
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch:  'full'
      }
    ]
  }
];