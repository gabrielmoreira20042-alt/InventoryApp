import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login',    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'products',           canActivate: [authGuard], loadComponent: () => import('./features/products/product-list/product-list.component').then(m => m.ProductListComponent) },
  { path: 'products/new',       canActivate: [authGuard], loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
  { path: 'products/edit/:id',  canActivate: [authGuard], loadComponent: () => import('./features/products/product-form/product-form.component').then(m => m.ProductFormComponent) },
  { path: 'history',            canActivate: [authGuard], loadComponent: () => import('./features/history/history.component').then(m => m.HistoryComponent) },
  { path: '**', redirectTo: '/dashboard' }
];
