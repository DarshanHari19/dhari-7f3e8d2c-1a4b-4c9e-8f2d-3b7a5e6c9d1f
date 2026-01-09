import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { Dashboard } from './dashboard';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
];
