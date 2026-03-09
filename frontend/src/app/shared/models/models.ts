export interface AuthResponse { token: string; name: string; email: string; role: string; expiresAt: string; }
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { name: string; email: string; password: string; }
export interface Product { id: number; name: string; description: string; price: number; quantity: number; sku: string; isActive: boolean; categoryId: number; categoryName: string; createdBy: string; createdAt: string; updatedAt: string; }
export interface ProductCreate { name: string; description: string; price: number; quantity: number; sku: string; categoryId: number; }
export interface ProductUpdate extends ProductCreate { isActive: boolean; }
export interface Category { id: number; name: string; description: string; productCount: number; }
export interface DashboardStats { totalProducts: number; activeProducts: number; lowStockCount: number; outOfStockCount: number; totalInventoryValue: number; totalCategories: number; stockByCategory: CategoryStock[]; lowStockProducts: LowStockProduct[]; topValueProducts: TopProduct[]; recentActivity: MonthlyActivity[]; }
export interface CategoryStock { categoryName: string; productCount: number; totalQuantity: number; totalValue: number; }
export interface LowStockProduct { id: number; name: string; sku: string; quantity: number; categoryName: string; }
export interface TopProduct { name: string; sku: string; price: number; quantity: number; totalValue: number; }
export interface MonthlyActivity { month: string; productsAdded: number; }
export interface AuditLog { id: number; action: string; entityTitle: string; entityId: number; changes: string | null; performedBy: string; performedAt: string; actionColor: string; }
export interface CsvImportResult { imported: number; skipped: number; errors: string[]; }
export interface ApiResponse<T> { success: boolean; message: string; data: T; }
export interface PagedResult<T> { items: T[]; totalItems: number; page: number; pageSize: number; totalPages: number; }
