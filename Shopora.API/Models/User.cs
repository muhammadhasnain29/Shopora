using System.Collections.Generic;

namespace Shopora.API.Models
{
    public class User
    {
        public int UserId { get; set; }

        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // User profile
        public UserProfile? UserProfile { get; set; }

        // User cart
        public Cart? Cart { get; set; }

        // User orders
        public List<Order> Orders { get; set; } = new List<Order>();
    }
}

