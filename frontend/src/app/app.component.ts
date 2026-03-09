import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from './core/services/auth.service';
import { DashboardService } from './core/services/dashboard.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLinkActive, MatIconModule, MatButtonModule, MatTooltipModule],
  template: `
    @if (!isAuthenticated()) {
      <router-outlet></router-outlet>
    }
    @if (isAuthenticated()) {
      <div class="shell">
        <aside class="sidebar" [class.collapsed]="collapsed()">
          <div class="sidebar-logo">
            <div class="logo-icon"><mat-icon>hub</mat-icon></div>
            @if (!collapsed()) {
              <div class="logo-text">
                <span class="logo-name">Inventory</span>
                <span class="logo-tag">Management</span>
              </div>
            }
            <button class="collapse-btn" (click)="toggleSidebar()">
              <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
            </button>
          </div>
          @if (!collapsed()) { <div class="nav-section-label">MENU</div> }
          <nav class="sidebar-nav">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active"
               [matTooltip]="collapsed() ? 'Dashboard' : ''" matTooltipPosition="right">
              <mat-icon>grid_view</mat-icon>
              @if (!collapsed()) { <span class="nav-label">Dashboard</span> }
            </a>
            <a class="nav-item" routerLink="/products" routerLinkActive="active"
               [matTooltip]="collapsed() ? 'Products' : ''" matTooltipPosition="right">
              <mat-icon>inventory_2</mat-icon>
              @if (!collapsed()) {
                <span class="nav-label">Products</span>
                @if (lowStockCount() > 0) { <span class="nav-badge warn">{{ lowStockCount() }}</span> }
              }
              @if (collapsed() && lowStockCount() > 0) { <span class="nav-badge-dot warn pulse"></span> }
            </a>
            <a class="nav-item" routerLink="/history" routerLinkActive="active"
               [matTooltip]="collapsed() ? 'History' : ''" matTooltipPosition="right">
              <mat-icon>history</mat-icon>
              @if (!collapsed()) { <span class="nav-label">History</span> }
            </a>
          </nav>
          <div class="sidebar-footer">
            <div class="user-area" [class.collapsed]="collapsed()">
              <div class="user-avatar">{{ userInitial() }}</div>
              @if (!collapsed()) {
                <div class="user-info">
                  <span class="user-name">{{ userName() }}</span>
                  <span class="user-role">{{ userRole() }}</span>
                </div>
                <button mat-icon-button (click)="logout()" matTooltip="Sign out" class="logout-btn">
                  <mat-icon>logout</mat-icon>
                </button>
              }
            </div>
            @if (collapsed()) {
              <button mat-icon-button (click)="logout()" matTooltip="Sign out" matTooltipPosition="right"
                      style="width:100%;display:flex;justify-content:center;color:var(--text-muted)">
                <mat-icon>logout</mat-icon>
              </button>
            }
          </div>
        </aside>
        <main class="main-content"><router-outlet></router-outlet></main>
      </div>
    }
  `,
  styles: [`
    .shell { display:flex; min-height:100vh; background:var(--bg-base); }
    .sidebar { width:240px; min-height:100vh; background:var(--bg-surface); border-right:1px solid var(--border); display:flex; flex-direction:column; transition:width 0.25s cubic-bezier(.4,0,.2,1); position:sticky; top:0; height:100vh; overflow:hidden; flex-shrink:0; z-index:100; }
    .sidebar.collapsed { width:64px; }
    .sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px 14px 16px; border-bottom:1px solid var(--border); min-height:68px; position:relative; }
    .logo-icon { width:36px; height:36px; border-radius:9px; background:linear-gradient(135deg,var(--cyan),var(--purple)); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .logo-icon mat-icon { font-size:20px; width:20px; height:20px; color:#fff; }
    .logo-text { flex:1; overflow:hidden; }
    .logo-name { display:block; font-family:var(--font-display); font-size:1.05rem; font-weight:800; color:var(--text-primary); line-height:1.1; white-space:nowrap; }
    .logo-tag { display:block; font-size:0.62rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.12em; font-weight:500; }
    .collapse-btn { position:absolute; right:8px; top:50%; transform:translateY(-50%); background:var(--bg-card); border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; border-radius:6px; width:24px; height:24px; display:flex; align-items:center; justify-content:center; padding:0; opacity:0; transition:opacity 0.2s; }
    .collapse-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .sidebar:hover .collapse-btn { opacity:1; }
    .nav-section-label { font-size:0.6rem; letter-spacing:0.14em; color:var(--text-muted); font-weight:700; padding:16px 18px 6px; text-transform:uppercase; }
    .sidebar-nav { flex:1; padding:6px 8px; display:flex; flex-direction:column; gap:2px; }
    .nav-item { display:flex; align-items:center; gap:11px; padding:9px 10px; border-radius:8px; color:var(--text-secondary); text-decoration:none; font-size:0.9rem; font-weight:500; transition:all 0.15s; white-space:nowrap; position:relative; cursor:pointer; border:1px solid transparent; }
    .nav-item mat-icon { font-size:20px; width:20px; height:20px; flex-shrink:0; }
    .nav-item:hover { background:rgba(255,255,255,.05); color:var(--text-primary); }
    .nav-item.active { background:var(--cyan-glow); color:var(--cyan); border-color:rgba(0,229,255,.15); }
    .nav-item.active mat-icon { color:var(--cyan); }
    .sidebar.collapsed .nav-item { justify-content:center; padding:10px; }
    .nav-label { flex:1; }
    .nav-badge { min-width:20px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:0.65rem; font-weight:700; padding:0 5px; }
    .nav-badge.warn { background:rgba(245,166,35,.15); color:var(--warning); border:1px solid rgba(245,166,35,.3); }
    .nav-badge-dot { position:absolute; top:6px; right:6px; width:7px; height:7px; border-radius:50%; }
    .nav-badge-dot.warn { background:var(--warning); }
    .sidebar-footer { padding:12px 8px; border-top:1px solid var(--border); }
    .user-area { display:flex; align-items:center; gap:10px; padding:8px; border-radius:8px; transition:background 0.15s; }
    .user-area:hover { background:rgba(255,255,255,.04); }
    .user-area.collapsed { justify-content:center; }
    .user-avatar { width:32px; height:32px; border-radius:8px; background:linear-gradient(135deg,var(--cyan),var(--purple)); display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:700; color:#fff; flex-shrink:0; font-family:var(--font-display); }
    .user-info { flex:1; overflow:hidden; }
    .user-name { display:block; font-size:0.82rem; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .user-role { display:block; font-size:0.68rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; }
    .logout-btn { color:var(--text-muted) !important; }
    .main-content { flex:1; overflow-x:hidden; min-width:0; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
    .pulse { animation:pulse 2s infinite; }
  `]
})
export class AppComponent {
  collapsed = signal(false);
  lowStockCount = signal(0);
  isAuthenticated = computed(() => this.authService.isLoggedIn());
  userName       = computed(() => this.authService.currentUser()?.name ?? '');
  userRole       = computed(() => this.authService.currentUser()?.role ?? '');
  userInitial    = computed(() => (this.authService.currentUser()?.name ?? 'U').charAt(0).toUpperCase());

  constructor(public authService: AuthService, private dashboardService: DashboardService, private router: Router) {
    if (this.authService.isLoggedIn()) this.loadLowStockCount();
  }

  loadLowStockCount() {
    this.dashboardService.getStats().subscribe({ next: r => this.lowStockCount.set(r.data.lowStockCount), error: () => {} });
  }

  toggleSidebar() { this.collapsed.update(v => !v); }
  logout() { this.authService.logout(); }
}
