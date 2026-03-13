import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Category, PagedResult, Product, ProductCreate, ProductUpdate } from '../../shared/models/models';
import { environment } from '../../../environments/environment';  // 

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(page = 1, pageSize = 10, search?: string, categoryId?: number): Observable<ApiResponse<PagedResult<Product>>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId);
    return this.http.get<ApiResponse<PagedResult<Product>>>(`${this.API_URL}/products`, { params });
  }

  getProductById(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.API_URL}/products/${id}`);
  }

  createProduct(product: ProductCreate): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.API_URL}/products`, product);
  }

  updateProduct(id: number, product: ProductUpdate): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.API_URL}/products/${id}`, product);
  }

  deleteProduct(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.API_URL}/products/${id}`);
  }

  getCategories(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(`${this.API_URL}/categories`);
  }

  exportCsv(): Observable<Blob> {
    return this.http.get(`${this.API_URL}/products/export/csv`, { responseType: 'blob' });
  }

  importCsv(file: File): Observable<ApiResponse<{ imported: number; errors: string[] }>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ApiResponse<{ imported: number; errors: string[] }>>(`${this.API_URL}/products/import/csv`, form);
  }
}
