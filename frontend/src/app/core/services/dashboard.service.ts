import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, AuditLog, DashboardStats, PagedResult } from '../../shared/models/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly API = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API}/dashboard/stats`);
  }

  getHistory(page = 1, pageSize = 20): Observable<ApiResponse<PagedResult<AuditLog>>> {
    return this.http.get<ApiResponse<PagedResult<AuditLog>>>(`${this.API}/auditlog?page=${page}&pageSize=${pageSize}`);
  }
}
