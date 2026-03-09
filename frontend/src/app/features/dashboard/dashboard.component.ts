import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardStats } from '../../shared/models/models';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, CurrencyPipe],
  template: `
    <div class="dashboard-page">

      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Real-time inventory overview</p>
        </div>
        <button class="refresh-btn" (click)="loadStats()" [disabled]="loading">
          <mat-icon [class.spinning]="loading">refresh</mat-icon>
          Refresh
        </button>
      </div>

      @if (loading) {
        <div class="loading-state"><mat-spinner diameter="40"></mat-spinner></div>
      }

      @if (!loading && stats) {
        <div class="stats-grid">
          <div class="stat-card accent" style="animation-delay:0ms">
            <div class="stat-top">
              <div class="stat-icon"><mat-icon>inventory_2</mat-icon></div>
              <span class="stat-tag">Catalogue</span>
            </div>
            <div class="stat-value">{{ stats.totalProducts }}</div>
            <div class="stat-label">Total Products</div>
            <div class="stat-sub">{{ stats.activeProducts }} active</div>
          </div>
          <div class="stat-card blue" style="animation-delay:80ms">
            <div class="stat-top">
              <div class="stat-icon"><mat-icon>euro</mat-icon></div>              <span class="stat-tag">Finance</span>
            </div>
            <div class="stat-value fit">{{ stats.totalInventoryValue | currency:'EUR':'symbol':'1.0-0' }}</div>
            <div class="stat-label">Inventory Value</div>
            <div class="stat-sub">Total stock valued</div>
          </div>
          <div class="stat-card warning" style="animation-delay:160ms">
            <div class="stat-top">
              <div class="stat-icon"><mat-icon>warning_amber</mat-icon></div>
              <span class="stat-tag">Warning</span>
            </div>
            <div class="stat-value">{{ stats.lowStockCount }}</div>
            <div class="stat-label">Low Stock</div>
            <div class="stat-sub">Fewer than 10 units</div>
          </div>
          <div class="stat-card danger" style="animation-delay:240ms">
            <div class="stat-top">
              <div class="stat-icon"><mat-icon>remove_shopping_cart</mat-icon></div>
              <span class="stat-tag">Critical</span>
            </div>
            <div class="stat-value">{{ stats.outOfStockCount }}</div>
            <div class="stat-label">Out of Stock</div>
            <div class="stat-sub">No units available</div>
          </div>
        </div>

        <div class="charts-grid">
          <div class="chart-card">
            <div class="chart-header">
              <div>
                <h3>Products by Category</h3>
                <div class="chart-sub">Stock distribution per category</div>
              </div>
            </div>
            <canvas #barChart></canvas>
          </div>
          <div class="chart-card chart-card--sm">
            <div class="chart-header">
              <div>
                <h3>Stock Status</h3>
                <div class="chart-sub">Distribution by availability</div>
              </div>
            </div>
            <div class="doughnut-wrap">
              <canvas #doughnutChart></canvas>
              <div class="doughnut-center">
                <span class="dc-value">{{ stats.totalProducts }}</span>
                <span class="dc-label">total</span>
              </div>
            </div>
          </div>
        </div>

        @if (stats.recentActivity.length > 0) {
          <div class="chart-card chart-card--full">
            <div class="chart-header">
              <div>
                <h3>Activity — Last 6 Months</h3>
                <div class="chart-sub">Products created per month</div>
              </div>
            </div>
            <canvas #lineChart></canvas>
          </div>
        }

        <div class="bottom-grid">
          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">
                <mat-icon class="warn-icon">warning_amber</mat-icon>
                Low Stock Alerts
              </div>
              @if (stats.lowStockProducts.length > 0) {
                <span class="badge-count warn">{{ stats.lowStockProducts.length }}</span>
              }
            </div>
            @if (stats.lowStockProducts.length === 0) {
              <div class="empty-panel">
                <mat-icon>check_circle</mat-icon>
                <span>All stock levels are healthy!</span>
              </div>
            }
            @for (p of stats.lowStockProducts; track p.id) {
              <div class="alert-row" [routerLink]="['/products/edit', p.id]">
                <div class="alert-info">
                  <span class="alert-name">{{ p.name }}</span>
                  <span class="alert-sku font-mono">{{ p.sku }}</span>
                </div>
                <div class="alert-right">
                  <span class="alert-cat">{{ p.categoryName }}</span>
                  <span class="stock-pill" [class.critical]="p.quantity <= 3">{{ p.quantity }} units</span>
                </div>
              </div>
            }
          </div>

          <div class="panel">
            <div class="panel-header">
              <div class="panel-title">
                <mat-icon class="blue-icon">trending_up</mat-icon>
                Top Products by Value
              </div>
            </div>
            @for (p of stats.topValueProducts; track p.name; let i = $index) {
              <div class="top-row">
                <span class="rank">{{ i + 1 }}</span>
                <div class="top-info">
                  <span class="top-name">{{ p.name }}</span>
                  <span class="top-sku font-mono">{{ p.sku }} · {{ p.quantity }} units</span>
                </div>
                <span class="top-value">{{ p.totalValue | currency:'EUR':'symbol':'1.0-0' }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-page { padding:28px 32px; max-width:1400px; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; }
    .refresh-btn { display:flex; align-items:center; gap:6px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; border-radius:8px; padding:8px 16px; font-size:.85rem; font-family:var(--font-ui); transition:all .15s; }
    .refresh-btn:hover { border-color:var(--border-bright); color:var(--text-primary); }
    .refresh-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .spinning { animation:spin 1s linear infinite; }
    @keyframes spin { from{transform:rotate(0)} to{transform:rotate(360deg)} }
    .loading-state { display:flex; justify-content:center; padding:80px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:24px; }
    .stat-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:20px 22px 18px; transition:border-color .2s,transform .2s; animation:fadeIn .4s ease both; min-width:0; }
    .stat-card:hover { border-color:var(--border-bright); transform:translateY(-2px); }
    .stat-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .stat-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .stat-icon mat-icon { font-size:19px; width:19px; height:19px; }
    .stat-tag { font-size:.62rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em; color:var(--text-muted); background:var(--bg-hover); padding:2px 8px; border-radius:20px; }
    .stat-value { font-size:2rem; font-weight:800; font-family:var(--font-display); line-height:1; margin-bottom:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .stat-value.fit { font-size:1.35rem; }
    .stat-label { font-size:.72rem; text-transform:uppercase; letter-spacing:.07em; color:var(--text-secondary); font-weight:600; }
    .stat-sub { font-size:.74rem; color:var(--text-muted); margin-top:3px; }
    .stat-card.accent .stat-icon { background:rgba(0,229,255,.1); color:var(--cyan); }
    .stat-card.accent .stat-value { color:var(--cyan); }
    .stat-card.blue .stat-icon { background:rgba(77,166,255,.1); color:var(--info); }
    .stat-card.blue .stat-value { color:var(--info); }
    .stat-card.warning .stat-icon { background:rgba(245,166,35,.1); color:var(--warning); }
    .stat-card.warning .stat-value { color:var(--warning); }
    .stat-card.danger .stat-icon { background:rgba(255,77,109,.1); color:var(--danger); }
    .stat-card.danger .stat-value { color:var(--danger); }
    .charts-grid { display:grid; grid-template-columns:1fr 320px; gap:16px; margin-bottom:24px; }
    .chart-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:22px; }
    .chart-card--full { margin-bottom:24px; }
    .chart-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
    .chart-header h3 { margin:0; font-size:.9rem; font-weight:600; font-family:var(--font-display); }
    .chart-sub { font-size:.73rem; color:var(--text-muted); margin-top:2px; }
    canvas { max-height:230px; }
    .doughnut-wrap { position:relative; display:flex; justify-content:center; align-items:center; }
    .doughnut-center { position:absolute; text-align:center; pointer-events:none; }
    .dc-value { display:block; font-size:1.6rem; font-weight:800; font-family:var(--font-display); color:var(--text-primary); }
    .dc-label { display:block; font-size:.65rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.1em; }
    .bottom-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .panel { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:20px; }
    .panel-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; }
    .panel-title { display:flex; align-items:center; gap:8px; font-size:.9rem; font-weight:600; font-family:var(--font-display); }
    .warn-icon { color:var(--warning); font-size:18px; width:18px; height:18px; }
    .blue-icon { color:var(--info); font-size:18px; width:18px; height:18px; }
    .badge-count { min-width:22px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.68rem; font-weight:700; padding:0 6px; }
    .badge-count.warn { background:rgba(245,166,35,.15); color:var(--warning); border:1px solid rgba(245,166,35,.3); }
    .empty-panel { display:flex; flex-direction:column; align-items:center; padding:24px; color:var(--text-muted); gap:8px; }
    .empty-panel mat-icon { font-size:32px; width:32px; height:32px; color:var(--success); }
    .alert-row { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; margin:0 -8px; border-radius:8px; cursor:pointer; transition:background .15s; }
    .alert-row:hover { background:var(--bg-hover); }
    .alert-info { display:flex; flex-direction:column; gap:2px; }
    .alert-name { font-size:.85rem; font-weight:500; color:var(--text-primary); }
    .alert-sku { font-size:.72rem; color:var(--text-muted); }
    .alert-right { display:flex; align-items:center; gap:10px; }
    .alert-cat { font-size:.72rem; color:var(--text-secondary); }
    .stock-pill { padding:2px 10px; border-radius:20px; font-size:.72rem; font-weight:700; background:rgba(245,166,35,.12); color:var(--warning); border:1px solid rgba(245,166,35,.25); }
    .stock-pill.critical { background:rgba(255,77,109,.12); color:var(--danger); border-color:rgba(255,77,109,.25); }
    .top-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border); }
    .top-row:last-child { border-bottom:none; }
    .rank { width:22px; height:22px; border-radius:6px; background:var(--bg-hover); display:flex; align-items:center; justify-content:center; font-size:.7rem; font-weight:700; color:var(--text-muted); flex-shrink:0; }
    .top-info { flex:1; }
    .top-name { display:block; font-size:.85rem; font-weight:500; color:var(--text-primary); }
    .top-sku { display:block; font-size:.72rem; color:var(--text-muted); }
    .top-value { font-size:.88rem; font-weight:700; color:var(--cyan); white-space:nowrap; }
    .font-mono { font-family:var(--font-mono); }
    @media(max-width:1100px) { .stats-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:900px) { .charts-grid,.bottom-grid { grid-template-columns:1fr; } .dashboard-page { padding:20px 16px; } }
    @media(max-width:600px) { .stats-grid { grid-template-columns:1fr 1fr; } }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('barChart')      barChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('doughnutChart') doughnutRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart')     lineChartRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  loading = false;
  private charts: any[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit()     { this.loadStats(); }
  ngAfterViewInit() { if (this.stats) this.renderCharts(); }
  ngOnDestroy()  { this.charts.forEach(c => c?.destroy()); }

  loadStats() {
    this.loading = true;
    this.dashboardService.getStats().subscribe({
      next: res => { this.stats = res.data; this.loading = false; setTimeout(() => this.renderCharts(), 50); },
      error: ()  => { this.loading = false; }
    });
  }

  private renderCharts() {
    this.charts.forEach(c => c?.destroy());
    this.charts = [];
    if (!this.stats) return;

    const gridColor = 'rgba(255,255,255,0.05)';
    const textColor = '#4a5568';

    if (this.barChartRef) {
      const ctx = this.barChartRef.nativeElement.getContext('2d');
      this.charts.push(new Chart(ctx, {
        type: 'bar',
        data: {
          labels: this.stats.stockByCategory.map(c => c.categoryName),
          datasets: [
            { label: 'Products', data: this.stats.stockByCategory.map(c => c.productCount), backgroundColor: 'rgba(0,229,255,0.25)', borderColor: 'rgba(0,229,255,0.8)', borderWidth: 2, borderRadius: 6, yAxisID: 'y' },
            { label: 'Units in Stock', data: this.stats.stockByCategory.map(c => c.totalQuantity), backgroundColor: 'rgba(124,92,191,0.25)', borderColor: 'rgba(124,92,191,0.8)', borderWidth: 2, borderRadius: 6, yAxisID: 'y1' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: true,
          plugins: { legend: { labels: { color: textColor, font: { family: 'DM Sans', size: 11 } } } },
          scales: {
            x:  { grid: { color: gridColor }, ticks: { color: textColor } },
            y:  { grid: { color: gridColor }, ticks: { color: textColor }, position: 'left' },
            y1: { grid: { drawOnChartArea: false }, ticks: { color: textColor }, position: 'right' }
          }
        }
      }));
    }

    if (this.doughnutRef) {
      const ctx    = this.doughnutRef.nativeElement.getContext('2d');
      const normal = Math.max(0, (this.stats.activeProducts || 0) - this.stats.lowStockCount - this.stats.outOfStockCount);
      this.charts.push(new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Healthy', 'Low Stock', 'Out of Stock'],
          datasets: [{ data: [normal, this.stats.lowStockCount, this.stats.outOfStockCount], backgroundColor: ['rgba(0,200,150,0.8)', 'rgba(245,166,35,0.8)', 'rgba(255,77,109,0.8)'], borderColor: ['#0e1117'], borderWidth: 3, hoverOffset: 6 }]
        },
        options: { cutout: '72%', responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: { family: 'DM Sans', size: 11 }, padding: 12, boxWidth: 12 } } } }
      }));
    }

    if (this.lineChartRef && this.stats.recentActivity.length > 0) {
      const ctx      = this.lineChartRef.nativeElement.getContext('2d');
      const gradient = ctx!.createLinearGradient(0, 0, 0, 180);
      gradient.addColorStop(0, 'rgba(0,229,255,0.3)');
      gradient.addColorStop(1, 'rgba(0,229,255,0)');
      this.charts.push(new Chart(ctx, {
        type: 'line',
        data: {
          labels: this.stats.recentActivity.map(a => a.month),
          datasets: [{ label: 'Products created', data: this.stats.recentActivity.map(a => a.productsAdded), fill: true, backgroundColor: gradient, borderColor: 'rgba(0,229,255,0.9)', borderWidth: 2.5, pointBackgroundColor: 'rgba(0,229,255,1)', pointBorderColor: '#0e1117', pointBorderWidth: 2, pointRadius: 5, tension: 0.4 }]
        },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { labels: { color: textColor, font: { family: 'DM Sans', size: 11 } } } }, scales: { x: { grid: { color: gridColor }, ticks: { color: textColor } }, y: { grid: { color: gridColor }, ticks: { color: textColor, stepSize: 1 }, min: 0 } } }
      }));
    }
  }
}
