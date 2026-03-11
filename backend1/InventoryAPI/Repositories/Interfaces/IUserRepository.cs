using InventoryAPI.Models;

namespace InventoryAPI.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User> CreateAsync(User user);
    Task<bool> ExistsAsync(string email);
}
