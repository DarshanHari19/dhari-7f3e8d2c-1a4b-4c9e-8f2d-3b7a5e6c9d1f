import { Route } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { Dashboard } from './dashboard';
import { AuditLogComponent } from './audit-log/audit-log.component';

export const appRoutes: Route[] = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: Dashboard },
  { path: 'audit-log', component: AuditLogComponent },
];
