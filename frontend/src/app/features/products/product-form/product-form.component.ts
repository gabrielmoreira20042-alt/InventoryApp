import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ProductService } from '../../../core/services/product.service';
import { Category } from '../../../shared/models/models';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatIconModule, MatButtonModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="form-page">
      <div class="breadcrumb">
        <a routerLink="/products" class="bc-link"><mat-icon>arrow_back</mat-icon> Products</a>
        <mat-icon class="bc-sep">chevron_right</mat-icon>
        <span>{{ isEdit ? 'Edit Product' : 'New Product' }}</span>
      </div>

      <div class="form-card">
        <div class="card-header">
          <div class="card-icon" [class.edit-mode]="isEdit">
            <mat-icon>{{ isEdit ? 'edit' : 'add_circle_outline' }}</mat-icon>
          </div>
          <div>
            <h2 class="card-title">{{ isEdit ? 'Edit Product' : 'Create New Product' }}</h2>
            <p class="card-sub">{{ isEdit ? 'Update the product information' : 'Fill in the new product details' }}</p>
          </div>
        </div>

        <div class="card-divider"></div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="product-form">

          <div class="field-group full">
            <label>Product Name <span class="required">*</span></label>
            <div class="field-wrap" [class.focused]="nameFocused" [class.error]="form.get('name')?.invalid && form.get('name')?.touched">
              <input formControlName="name" placeholder="e.g. iPhone 15 Pro Max" (focus)="nameFocused=true" (blur)="nameFocused=false">
            </div>
            @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
              <span class="field-error">Name is required</span>
            }
          </div>

          <div class="field-row">
            <div class="field-group">
              <label>SKU <span class="required">*</span></label>
              <div class="field-wrap">
                <mat-icon class="field-pfx">qr_code</mat-icon>
                <input formControlName="sku" placeholder="e.g. APPL-001" class="mono-input">
              </div>
              @if (form.get('sku')?.hasError('required') && form.get('sku')?.touched) {
                <span class="field-error">SKU is required</span>
              }
            </div>
            <div class="field-group">
              <label>Category <span class="required">*</span></label>
              <select formControlName="categoryId" class="field-select">
                <option [ngValue]="null" disabled>Select category</option>
                @for (cat of categories; track cat.id) {
                  <option [ngValue]="cat.id">{{ cat.name }}</option>
                }
              </select>
              @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
                <span class="field-error">Category is required</span>
              }
            </div>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label>Price ($) <span class="required">*</span></label>
              <div class="field-wrap">
                <mat-icon class="field-pfx">attach_money</mat-icon>
                <input type="number" formControlName="price" placeholder="0.00" step="0.01" min="0.01">
              </div>
              @if (form.get('price')?.hasError('min') && form.get('price')?.touched) {
                <span class="field-error">Price must be greater than zero</span>
              }
            </div>
            <div class="field-group">
              <label>Stock Quantity <span class="required">*</span></label>
              <div class="field-wrap">
                <mat-icon class="field-pfx">inventory</mat-icon>
                <input type="number" formControlName="quantity" placeholder="0" min="0">
              </div>
            </div>
          </div>

          <div class="field-group full">
            <label>Description</label>
            <textarea formControlName="description" rows="3" placeholder="Detailed product description..."></textarea>
          </div>

          @if (isEdit) {
            <div class="toggle-wrap">
              <div class="toggle-info">
                <span class="toggle-label">Active Product</span>
                <span class="toggle-desc">Inactive products are hidden from listings</span>
              </div>
              <button type="button" class="toggle-btn" [class.on]="form.get('isActive')?.value" (click)="toggleActive()">
                <span class="toggle-thumb"></span>
              </button>
            </div>
          }

          <div class="form-actions">
            <a class="btn-cancel" routerLink="/products">Cancel</a>
            <button class="btn-save" type="submit" [disabled]="form.invalid || loading">
              @if (loading) { <span class="spinner"></span> }
              @if (!loading) { <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon> }
              {{ loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Product') }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { padding:28px 32px; max-width:760px; animation:fadeIn .3s ease; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
    .breadcrumb { display:flex; align-items:center; gap:6px; margin-bottom:24px; font-size:.82rem; color:var(--text-muted); }
    .bc-link { display:flex; align-items:center; gap:5px; color:var(--text-secondary); text-decoration:none; transition:color .15s; }
    .bc-link:hover { color:var(--cyan); }
    .bc-link mat-icon { font-size:16px; width:16px; height:16px; }
    .bc-sep { font-size:16px; width:16px; height:16px; }
    .form-card { background:var(--bg-card); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
    .card-header { display:flex; align-items:center; gap:16px; padding:24px 28px; }
    .card-icon { width:44px; height:44px; border-radius:11px; background:rgba(0,229,255,.1); display:flex; align-items:center; justify-content:center; }
    .card-icon mat-icon { color:var(--cyan); font-size:22px; width:22px; height:22px; }
    .card-icon.edit-mode { background:rgba(124,92,191,.1); }
    .card-icon.edit-mode mat-icon { color:var(--purple); }
    .card-title { font-family:var(--font-display); font-size:1.15rem; font-weight:700; margin:0 0 3px; }
    .card-sub { font-size:.8rem; color:var(--text-muted); margin:0; }
    .card-divider { height:1px; background:var(--border); }
    .product-form { padding:28px; display:flex; flex-direction:column; gap:20px; }
    .field-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .field-group { display:flex; flex-direction:column; gap:6px; }
    .field-group.full { grid-column:1/-1; }
    label { font-size:.78rem; font-weight:600; color:var(--text-secondary); letter-spacing:.04em; }
    .required { color:var(--danger); }
    .field-wrap { display:flex; align-items:center; background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; padding:0 14px; transition:border-color .15s,box-shadow .15s; }
    .field-wrap.focused, .field-wrap:focus-within { border-color:var(--cyan); box-shadow:0 0 0 3px rgba(0,229,255,.07); }
    .field-wrap.error { border-color:var(--danger); }
    .field-pfx { font-size:18px; width:18px; height:18px; color:var(--text-muted); flex-shrink:0; }
    input, .mono-input { flex:1; background:transparent; border:none; outline:none; color:var(--text-primary); font-size:.9rem; padding:12px 10px; font-family:var(--font-ui); }
    input::placeholder { color:var(--text-muted); }
    .mono-input { font-family:var(--font-mono); }
    .field-select { width:100%; background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; padding:12px 14px; color:var(--text-primary); font-size:.9rem; font-family:var(--font-ui); outline:none; cursor:pointer; transition:border-color .15s; }
    .field-select:focus { border-color:var(--cyan); }
    .field-select option { background:var(--bg-card); }
    textarea { background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; padding:12px 14px; color:var(--text-primary); font-size:.9rem; font-family:var(--font-ui); resize:vertical; outline:none; transition:border-color .15s; }
    textarea::placeholder { color:var(--text-muted); }
    textarea:focus { border-color:var(--cyan); }
    .field-error { font-size:.73rem; color:var(--danger); }
    .toggle-wrap { display:flex; align-items:center; justify-content:space-between; background:var(--bg-surface); border:1px solid var(--border); border-radius:10px; padding:14px 16px; }
    .toggle-label { font-size:.88rem; font-weight:600; color:var(--text-primary); display:block; }
    .toggle-desc { font-size:.74rem; color:var(--text-muted); display:block; margin-top:2px; }
    .toggle-btn { width:44px; height:24px; border-radius:12px; background:var(--border-bright); border:none; cursor:pointer; position:relative; transition:background .2s; padding:0; }
    .toggle-btn.on { background:var(--cyan); }
    .toggle-thumb { position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; top:3px; left:3px; transition:transform .2s; }
    .toggle-btn.on .toggle-thumb { transform:translateX(20px); }
    .form-actions { display:flex; justify-content:flex-end; gap:12px; padding-top:8px; border-top:1px solid var(--border); }
    .btn-cancel { display:flex; align-items:center; background:transparent; border:1px solid var(--border); color:var(--text-secondary); border-radius:9px; padding:10px 20px; font-size:.88rem; font-family:var(--font-ui); cursor:pointer; text-decoration:none; transition:all .15s; }
    .btn-cancel:hover { border-color:var(--border-bright); color:var(--text-primary); }
    .btn-save { display:flex; align-items:center; gap:6px; background:var(--cyan); color:#000; border:none; border-radius:9px; padding:10px 22px; font-size:.88rem; font-weight:700; font-family:var(--font-ui); cursor:pointer; transition:opacity .15s; }
    .btn-save mat-icon { font-size:18px; width:18px; height:18px; }
    .btn-save:disabled { opacity:.5; cursor:not-allowed; }
    .btn-save:not(:disabled):hover { opacity:.88; }
    .spinner { width:16px; height:16px; border:2px solid rgba(0,0,0,.2); border-top-color:#000; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to{transform:rotate(360deg)} }
    @media(max-width:700px) { .form-page { padding:16px; } .field-row { grid-template-columns:1fr; } }
  `]
})
export class ProductFormComponent implements OnInit {
  form: FormGroup;
  categories: Category[] = [];
  loading    = false;
  isEdit     = false;
  productId?: number;
  nameFocused = false;

  constructor(private fb: FormBuilder, private productService: ProductService, private router: Router, private route: ActivatedRoute, private snack: MatSnackBar) {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      sku:         ['', Validators.required],
      description: [''],
      price:       [null, [Validators.required, Validators.min(0.01)]],
      quantity:    [0,    [Validators.required, Validators.min(0)]],
      categoryId:  [null, Validators.required],
      isActive:    [true]
    });
  }

  ngOnInit() {
    this.loadCategories();
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.isEdit = true; this.productId = +id; this.loadProduct(+id); }
  }

  loadCategories() { this.productService.getCategories().subscribe({ next: r => this.categories = r.data }); }

  loadProduct(id: number) {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: r  => { this.form.patchValue(r.data); this.loading = false; },
      error: () => { this.snack.open('Product not found', 'Close', { duration: 3000 }); this.router.navigate(['/products']); }
    });
  }

  toggleActive() { this.form.patchValue({ isActive: !this.form.get('isActive')?.value }); }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    const req$ = this.isEdit
      ? this.productService.updateProduct(this.productId!, this.form.value)
      : this.productService.createProduct(this.form.value);
    req$.subscribe({
      next: () => this.router.navigate(['/products']),
      error: err => { this.loading = false; this.snack.open(err.error?.message || 'Error saving product', 'Close', { duration: 3000 }); }
    });
  }
}
