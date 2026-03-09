import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { ProductService } from '../../../core/services/product.service';
import { Category, Product } from '../../../shared/models/models';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatInputModule, MatFormFieldModule, MatSelectModule, MatPaginatorModule, MatSnackBarModule, MatProgressSpinnerModule, MatTooltipModule, MatMenuModule],
  template: `
    <div class="products-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">{{ totalItems }} products in inventory</p>
        </div>
        <div class="header-actions">
          <button class="action-btn" [matMenuTriggerFor]="csvMenu">
            <mat-icon>upload_file</mat-icon>
            CSV
            <mat-icon style="font-size:16px;width:16px;height:16px">expand_more</mat-icon>
          </button>
          <mat-menu #csvMenu="matMenu">
            <button mat-menu-item (click)="exportCsv()"><mat-icon>download</mat-icon> Export CSV</button>
            <button mat-menu-item (click)="csvInput.click()"><mat-icon>upload</mat-icon> Import CSV</button>
          </mat-menu>
          <input #csvInput type="file" accept=".csv" hidden (change)="importCsv($event)">
          <a class="btn-primary" routerLink="/products/new">
            <mat-icon>add</mat-icon>
            New Product
          </a>
        </div>
      </div>

      <div class="filters-bar">
        <div class="search-wrap">
          <mat-icon class="search-icon">search</mat-icon>
          <input class="search-input" [(ngModel)]="searchTerm" (ngModelChange)="onSearchChange($event)" placeholder="Search by name or SKU...">
          @if (searchTerm) {
            <button class="clear-btn" (click)="searchTerm=''; loadProducts()"><mat-icon>close</mat-icon></button>
          }
        </div>
        <select class="cat-select" [(ngModel)]="selectedCategory" (ngModelChange)="loadProducts()">
          <option [ngValue]="null">All categories</option>
          @for (cat of categories; track cat.id) {
            <option [ngValue]="cat.id">{{ cat.name }}</option>
          }
        </select>
      </div>

      @if (loading) {
        <div class="loading-state"><mat-spinner diameter="36"></mat-spinner></div>
      }

      @if (!loading) {
        <div class="table-wrap">
          <table mat-table [dataSource]="products">
            <ng-container matColumnDef="sku">
              <th mat-header-cell *matHeaderCellDef>SKU</th>
              <td mat-cell *matCellDef="let p"><code class="sku-code">{{ p.sku }}</code></td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Product</th>
              <td mat-cell *matCellDef="let p">
                <div class="product-cell">
                  <span class="product-name">{{ p.name }}</span>
                  @if (p.description) {
                    <span class="product-desc">{{ p.description | slice:0:55 }}{{ p.description.length > 55 ? '…' : '' }}</span>
                  }
                </div>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let p"><span class="cat-pill">{{ p.categoryName }}</span></td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th mat-header-cell *matHeaderCellDef>Price</th>
              <td mat-cell *matCellDef="let p"><span class="price-value">{{ p.price | currency:'EUR' }}</span></td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Stock</th>
              <td mat-cell *matCellDef="let p">
                <span class="stock-pill"
                  [class.stock-ok]="p.quantity > 10"
                  [class.stock-low]="p.quantity > 0 && p.quantity <= 10"
                  [class.stock-out]="p.quantity === 0">
                  @if (p.quantity === 0) { <mat-icon style="font-size:12px;width:12px;height:12px">remove_shopping_cart</mat-icon> }
                  @if (p.quantity > 0 && p.quantity <= 10) { <mat-icon style="font-size:12px;width:12px;height:12px">warning_amber</mat-icon> }
                  {{ p.quantity }} units
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let p">
                <span class="status-dot" [class.active]="p.isActive">
                  <span class="dot"></span>
                  {{ p.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let p">
                <div class="row-actions">
                  <a class="icon-btn" [routerLink]="['/products/edit', p.id]" matTooltip="Edit"><mat-icon>edit</mat-icon></a>
                  <button class="icon-btn danger" (click)="deleteProduct(p)" matTooltip="Delete"><mat-icon>delete</mat-icon></button>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            <tr class="mat-row" *matNoDataRow>
              <td [attr.colspan]="columns.length">
                <div class="empty-table">
                  <mat-icon>inventory_2</mat-icon>
                  <p>No products found</p>
                  <a class="btn-primary" routerLink="/products/new">Create first product</a>
                </div>
              </td>
            </tr>
          </table>
          <mat-paginator [length]="totalItems" [pageSize]="pageSize" [pageSizeOptions]="[10,25,50]" (page)="onPageChange($event)" showFirstLastButtons></mat-paginator>
        </div>
      }
    </div>
  `,
  styles: [`
    .products-page { padding:28px 32px; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
    .header-actions { display:flex; gap:10px; align-items:center; }
    .action-btn { display:flex; align-items:center; gap:5px; background:var(--bg-card); border:1px solid var(--border); color:var(--text-secondary); cursor:pointer; border-radius:8px; padding:8px 14px; font-size:.85rem; font-family:var(--font-ui); transition:all .15s; }
    .action-btn:hover { border-color:var(--border-bright); color:var(--text-primary); }
    .action-btn mat-icon { font-size:18px; width:18px; height:18px; }
    .btn-primary { display:flex; align-items:center; gap:6px; background:var(--cyan); color:#000; border:none; border-radius:8px; padding:9px 18px; font-size:.85rem; font-weight:600; font-family:var(--font-ui); cursor:pointer; text-decoration:none; transition:opacity .15s; }
    .btn-primary:hover { opacity:.88; }
    .btn-primary mat-icon { font-size:18px; width:18px; height:18px; }
    .filters-bar { display:flex; gap:12px; margin-bottom:20px; align-items:center; }
    .search-wrap { flex:1; display:flex; align-items:center; background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:0 14px; transition:border-color .15s; }
    .search-wrap:focus-within { border-color:var(--cyan); }
    .search-icon { font-size:18px; width:18px; height:18px; color:var(--text-muted); flex-shrink:0; }
    .search-input { flex:1; background:transparent; border:none; outline:none; color:var(--text-primary); font-size:.88rem; padding:10px; font-family:var(--font-ui); }
    .search-input::placeholder { color:var(--text-muted); }
    .clear-btn { background:none; border:none; cursor:pointer; color:var(--text-muted); display:flex; align-items:center; padding:0; }
    .clear-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .cat-select { background:var(--bg-card); border:1px solid var(--border); color:var(--text-primary); border-radius:10px; padding:9px 14px; font-size:.85rem; font-family:var(--font-ui); cursor:pointer; outline:none; transition:border-color .15s; min-width:180px; }
    .cat-select:focus { border-color:var(--cyan); }
    .cat-select option { background:var(--bg-card); }
    .loading-state { display:flex; justify-content:center; padding:60px; }
    .table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; overflow:hidden; }
    .sku-code { font-family:var(--font-mono); font-size:.78rem; background:var(--bg-hover); padding:2px 8px; border-radius:5px; color:var(--cyan-dim); border:1px solid var(--border); }
    .product-cell { display:flex; flex-direction:column; gap:2px; }
    .product-name { font-weight:500; font-size:.88rem; }
    .product-desc { font-size:.75rem; color:var(--text-muted); }
    .cat-pill { font-size:.72rem; background:rgba(124,92,191,.12); color:var(--purple); border:1px solid rgba(124,92,191,.2); padding:2px 9px; border-radius:20px; font-weight:600; }
    .price-value { font-family:var(--font-mono); font-size:.85rem; font-weight:600; }
    .stock-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:.72rem; font-weight:700; }
    .stock-ok  { background:rgba(0,200,150,.1);  color:var(--success); border:1px solid rgba(0,200,150,.2); }
    .stock-low { background:rgba(245,166,35,.1); color:var(--warning); border:1px solid rgba(245,166,35,.2); }
    .stock-out { background:rgba(255,77,109,.1); color:var(--danger);  border:1px solid rgba(255,77,109,.2); }
    .status-dot { display:inline-flex; align-items:center; gap:6px; font-size:.78rem; font-weight:500; }
    .dot { width:7px; height:7px; border-radius:50%; background:var(--text-muted); }
    .status-dot.active .dot { background:var(--success); box-shadow:0 0 6px rgba(0,200,150,.6); }
    .status-dot.active { color:var(--success); }
    .row-actions { display:flex; gap:4px; opacity:0; transition:opacity .15s; }
    tr:hover .row-actions { opacity:1; }
    .icon-btn { width:32px; height:32px; border-radius:7px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); background:transparent; cursor:pointer; color:var(--text-secondary); transition:all .15s; text-decoration:none; }
    .icon-btn mat-icon { font-size:16px; width:16px; height:16px; }
    .icon-btn:hover { background:var(--bg-hover); color:var(--text-primary); border-color:var(--border-bright); }
    .icon-btn.danger:hover { background:rgba(255,77,109,.1); color:var(--danger); border-color:rgba(255,77,109,.3); }
    .empty-table { display:flex; flex-direction:column; align-items:center; padding:60px; gap:12px; color:var(--text-muted); }
    .empty-table mat-icon { font-size:48px; width:48px; height:48px; }
    @media(max-width:900px) { .products-page { padding:16px; } .filters-bar { flex-wrap:wrap; } }
  `]
})
export class ProductListComponent implements OnInit {
  products: Product[]  = [];
  categories: Category[] = [];
  loading          = false;
  currentPage      = 1;
  pageSize         = 10;
  totalItems       = 0;
  searchTerm       = '';
  selectedCategory: number | null = null;
  columns          = ['sku', 'name', 'category', 'price', 'quantity', 'status', 'actions'];

  private searchSubject = new Subject<string>();

  constructor(private productService: ProductService, private snack: MatSnackBar) {
    this.searchSubject.pipe(debounceTime(380), distinctUntilChanged()).subscribe(() => {
      this.currentPage = 1; this.loadProducts();
    });
  }

  ngOnInit() { this.loadCategories(); this.loadProducts(); }

  loadProducts() {
    this.loading = true;
    this.productService.getProducts(this.currentPage, this.pageSize, this.searchTerm || undefined, this.selectedCategory || undefined)
      .subscribe({
        next: r  => { this.products = r.data.items; this.totalItems = r.data.totalItems; this.loading = false; },
        error: () => { this.loading = false; this.snack.open('Error loading products', 'Close', { duration: 3000 }); }
      });
  }

  loadCategories() { this.productService.getCategories().subscribe({ next: r => this.categories = r.data }); }

  onSearchChange(v: string) { this.searchSubject.next(v); }
  onPageChange(e: PageEvent) { this.currentPage = e.pageIndex + 1; this.pageSize = e.pageSize; this.loadProducts(); }

  deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    this.productService.deleteProduct(p.id).subscribe({
      next: () => { this.snack.open('Product deleted', 'Close', { duration: 3000 }); this.loadProducts(); },
      error: ()  => this.snack.open('Error deleting product', 'Close', { duration: 3000 })
    });
  }

  exportCsv() {
    this.productService.exportCsv().subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = `products_${new Date().toISOString().slice(0,10)}.csv`; a.click();
        URL.revokeObjectURL(url);
        this.snack.open('CSV exported!', 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Error exporting CSV', 'Close', { duration: 3000 })
    });
  }

  importCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.productService.importCsv(file).subscribe({
      next: r  => { this.snack.open(`${r.data.imported} product(s) imported!`, 'Close', { duration: 4000 }); this.loadProducts(); (event.target as HTMLInputElement).value = ''; },
      error: () => this.snack.open('Error importing CSV', 'Close', { duration: 3000 })
    });
  }
}
