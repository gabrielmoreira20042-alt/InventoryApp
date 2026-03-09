import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatSnackBarModule, MatIconModule],
  template: `
    <div class="auth-shell">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo"><mat-icon>hub</mat-icon></div>
          <h1 class="brand-name">Inventry</h1>
          <p class="brand-desc">Inventory management system built for modern teams</p>
          <div class="brand-features">
            <div class="feature"><mat-icon>check_circle</mat-icon> Real-time dashboard with charts</div>
            <div class="feature"><mat-icon>check_circle</mat-icon> Automatic low stock alerts</div>
            <div class="feature"><mat-icon>check_circle</mat-icon> CSV import and export</div>
            <div class="feature"><mat-icon>check_circle</mat-icon> Full change history log</div>
          </div>
        </div>
        <div class="brand-bg-grid"></div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-wrap">
          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="field-group" [class.has-error]="form.get('email')?.invalid && form.get('email')?.touched">
              <label>Email</label>
              <div class="field-wrap">
                <mat-icon class="field-icon">alternate_email</mat-icon>
                <input type="email" formControlName="email" placeholder="name@company.com" autocomplete="email">
              </div>
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <span class="field-error">Invalid email address</span>
              }
            </div>

            <div class="field-group" [class.has-error]="form.get('password')?.invalid && form.get('password')?.touched">
              <label>Password</label>
              <div class="field-wrap">
                <mat-icon class="field-icon">lock_outline</mat-icon>
                <input [type]="showPwd ? 'text' : 'password'" formControlName="password" placeholder="••••••••" autocomplete="current-password">
                <button type="button" class="toggle-pwd" (click)="showPwd = !showPwd">
                  <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>

            @if (error) {
              <div class="form-error"><mat-icon>error_outline</mat-icon>{{ error }}</div>
            }

            <button class="btn-submit" type="submit" [disabled]="form.invalid || loading">
              @if (loading) { <span class="spinner"></span> }
              @if (!loading) { <mat-icon>login</mat-icon> }
              {{ loading ? 'Signing in...' : 'Sign In' }}
            </button>
          </form>

          <div class="form-footer">
            <p>Don't have an account? <a routerLink="/register">Create one</a></p>
            <div class="demo-creds">
              <mat-icon>info_outline</mat-icon>
              Demo: admin&#64;inventory.com / Admin123!
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-shell { min-height:100vh; display:flex; background:var(--bg-base); }
    .auth-brand { flex:1; position:relative; overflow:hidden; background:linear-gradient(135deg,#07090f 0%,#0d1422 60%,#111830 100%); display:flex; align-items:center; justify-content:center; border-right:1px solid var(--border); }
    .brand-content { position:relative; z-index:1; padding:48px; max-width:420px; }
    .brand-logo { width:56px; height:56px; border-radius:14px; background:linear-gradient(135deg,var(--cyan),var(--purple)); display:flex; align-items:center; justify-content:center; margin-bottom:24px; box-shadow:0 0 32px rgba(0,229,255,.2); }
    .brand-logo mat-icon { font-size:28px; width:28px; height:28px; color:#fff; }
    .brand-name { font-family:var(--font-display); font-size:2.8rem; font-weight:800; margin:0 0 12px; background:linear-gradient(90deg,var(--cyan),var(--purple)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .brand-desc { color:var(--text-secondary); font-size:1rem; line-height:1.6; margin-bottom:32px; }
    .brand-features { display:flex; flex-direction:column; gap:12px; }
    .feature { display:flex; align-items:center; gap:10px; font-size:0.875rem; color:var(--text-secondary); }
    .feature mat-icon { font-size:18px; width:18px; height:18px; color:var(--cyan); flex-shrink:0; }
    .brand-bg-grid { position:absolute; inset:0; opacity:.04; background-image:linear-gradient(var(--cyan) 1px,transparent 1px),linear-gradient(90deg,var(--cyan) 1px,transparent 1px); background-size:40px 40px; }
    .auth-form-panel { width:480px; display:flex; align-items:center; justify-content:center; padding:48px 32px; }
    .auth-form-wrap { width:100%; max-width:380px; }
    .form-header { margin-bottom:32px; }
    .form-header h2 { font-family:var(--font-display); font-size:1.7rem; font-weight:700; margin:0 0 6px; }
    .form-header p { color:var(--text-secondary); font-size:.9rem; margin:0; }
    .auth-form { display:flex; flex-direction:column; gap:18px; }
    .field-group { display:flex; flex-direction:column; gap:6px; }
    label { font-size:.8rem; font-weight:600; color:var(--text-secondary); letter-spacing:.04em; }
    .field-wrap { display:flex; align-items:center; background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:0 14px; transition:border-color .15s; }
    .field-wrap:focus-within { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,229,255,.08); }
    .has-error .field-wrap { border-color:var(--danger); }
    .field-icon { font-size:18px; width:18px; height:18px; color:var(--text-muted); flex-shrink:0; }
    input { flex:1; background:transparent; border:none; outline:none; color:var(--text-primary); font-size:.9rem; padding:12px 10px; font-family:var(--font-ui); }
    input::placeholder { color:var(--text-muted); }
    .toggle-pwd { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:0; }
    .toggle-pwd mat-icon { font-size:18px; width:18px; height:18px; }
    .field-error { font-size:.75rem; color:var(--danger); }
    .form-error { display:flex; align-items:center; gap:8px; background:rgba(255,77,109,.1); border:1px solid rgba(255,77,109,.25); color:var(--danger); border-radius:8px; padding:10px 14px; font-size:.85rem; }
    .form-error mat-icon { font-size:18px; width:18px; height:18px; }
    .btn-submit { display:flex; align-items:center; justify-content:center; gap:8px; background:var(--cyan); color:#000; border:none; border-radius:10px; padding:13px; font-size:.95rem; font-weight:700; font-family:var(--font-ui); cursor:pointer; transition:opacity .15s; margin-top:4px; }
    .btn-submit mat-icon { font-size:20px; width:20px; height:20px; }
    .btn-submit:disabled { opacity:.5; cursor:not-allowed; }
    .btn-submit:not(:disabled):hover { opacity:.88; }
    .spinner { width:18px; height:18px; border:2px solid rgba(0,0,0,.2); border-top-color:#000; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .form-footer { margin-top:24px; text-align:center; }
    .form-footer p { color:var(--text-secondary); font-size:.875rem; margin:0 0 12px; }
    .form-footer a { color:var(--cyan); text-decoration:none; font-weight:600; }
    .demo-creds { display:inline-flex; align-items:center; gap:6px; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:8px 14px; font-size:.78rem; color:var(--text-muted); }
    .demo-creds mat-icon { font-size:14px; width:14px; height:14px; }
    @media(max-width:900px) { .auth-brand { display:none; } .auth-form-panel { width:100%; } }
  `]
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPwd = false;
  error   = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private snack: MatSnackBar) {
    this.form = this.fb.group({ email: ['', [Validators.required, Validators.email]], password: ['', Validators.required] });
    if (this.authService.isLoggedIn()) this.router.navigate(['/dashboard']);
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true; this.error = '';
    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: err => { this.loading = false; this.error = err.error?.message || 'Invalid email or password'; }
    });
  }
}
