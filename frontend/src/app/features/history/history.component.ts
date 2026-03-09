import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuditLog } from '../../shared/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatPaginatorModule, MatProgressSpinnerModule],
  template: `
    <div class="history-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Change History</h1>
          <p class="page-subtitle">Complete log of all operations performed</p>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state"><mat-spinner diameter="40"></mat-spinner></div>
      }

      @if (!loading) {
        <div class="timeline-card">
          @if (logs.length === 0) {
            <div class="empty-state">
              <mat-icon>history</mat-icon>
              <p>No changes recorded yet</p>
            </div>
          }
          @for (log of logs; track log.id) {
            <div class="timeline-row">
              <div class="tl-icon" [ngClass]="getActionClass(log.action)">
                <mat-icon>{{ getActionIcon(log.action) }}</mat-icon>
              </div>
              <div class="tl-body">
                <div class="tl-header">
                  <span class="tl-action-badge" [ngClass]="getActionClass(log.action)">
                    {{ getActionLabel(log.action) }}
                  </span>
                  <span class="tl-product">{{ log.entityTitle }}</span>
                </div>
                @if (log.changes) {
                  <div class="tl-changes">{{ log.changes }}</div>
                }
                <div class="tl-meta">
                  <mat-icon class="meta-icon">person</mat-icon>
                  <span>{{ log.performedBy }}</span>
                  <span class="meta-sep">·</span>
                  <mat-icon class="meta-icon">schedule</mat-icon>
                  <span>{{ formatDate(log.performedAt) }}</span>
                </div>
              </div>
            </div>
          }
        </div>

        <mat-paginator
          [length]="totalItems" [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .history-page { padding:28px 32px; max-width:900px; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .page-header { margin-bottom:28px; }
    .loading-state { display:flex; justify-content:center; padding:80px; }
    .timeline-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; overflow:hidden; margin-bottom:16px; }
    .empty-state { display:flex; flex-direction:column; align-items:center; padding:60px; color:var(--text-muted); gap:12px; }
    .empty-state mat-icon { font-size:48px; width:48px; height:48px; }
    .timeline-row { display:flex; gap:16px; padding:18px 24px; border-bottom:1px solid var(--border); align-items:flex-start; transition:background .15s; }
    .timeline-row:last-child { border-bottom:none; }
    .timeline-row:hover { background:var(--bg-hover); }
    .tl-icon { width:36px; height:36px; border-radius:9px; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
    .tl-icon mat-icon { font-size:18px; width:18px; height:18px; }
    .tl-icon.create { background:rgba(0,200,150,.12); color:var(--success); }
    .tl-icon.update { background:rgba(77,166,255,.12); color:var(--info); }
    .tl-icon.delete { background:rgba(255,77,109,.12); color:var(--danger); }
    .tl-body { flex:1; }
    .tl-header { display:flex; align-items:center; gap:10px; margin-bottom:5px; flex-wrap:wrap; }
    .tl-action-badge { font-size:.65rem; font-weight:700; padding:2px 9px; border-radius:20px; text-transform:uppercase; letter-spacing:.08em; }
    .tl-action-badge.create { background:rgba(0,200,150,.12); color:var(--success); border:1px solid rgba(0,200,150,.25); }
    .tl-action-badge.update { background:rgba(77,166,255,.12); color:var(--info);    border:1px solid rgba(77,166,255,.25); }
    .tl-action-badge.delete { background:rgba(255,77,109,.12); color:var(--danger);  border:1px solid rgba(255,77,109,.25); }
    .tl-product { font-size:.9rem; font-weight:600; color:var(--text-primary); }
    .tl-changes { font-size:.8rem; color:var(--text-secondary); background:var(--bg-hover); border-radius:6px; padding:6px 10px; margin:6px 0; border-left:2px solid var(--border-bright); }
    .tl-meta { display:flex; align-items:center; gap:5px; font-size:.75rem; color:var(--text-muted); margin-top:6px; }
    .meta-icon { font-size:13px; width:13px; height:13px; }
    .meta-sep { margin:0 3px; }
    mat-paginator { background:var(--bg-card) !important; border-radius:14px; border:1px solid var(--border); }
    @media(max-width:600px) { .history-page { padding:16px; } .timeline-row { padding:14px 16px; } }
  `]
})
export class HistoryComponent implements OnInit {
  logs: AuditLog[] = [];
  loading     = false;
  totalItems  = 0;
  pageSize    = 20;
  currentPage = 1;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() { this.loadHistory(); }

  loadHistory() {
    this.loading = true;
    this.dashboardService.getHistory(this.currentPage, this.pageSize).subscribe({
      next: res => { this.logs = res.data.items; this.totalItems = res.data.totalItems; this.loading = false; },
      error: ()  => { this.loading = false; }
    });
  }

  onPageChange(e: PageEvent) { this.currentPage = e.pageIndex + 1; this.pageSize = e.pageSize; this.loadHistory(); }

  getActionIcon(a: string)  { return a === 'CREATE' ? 'add_circle' : a === 'UPDATE' ? 'edit' : 'delete'; }
  getActionClass(a: string) { return a === 'CREATE' ? 'create' : a === 'UPDATE' ? 'update' : 'delete'; }
  getActionLabel(a: string) { return a === 'CREATE' ? 'Created' : a === 'UPDATE' ? 'Updated' : 'Deleted'; }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
