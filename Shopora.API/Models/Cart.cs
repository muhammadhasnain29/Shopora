using System;
using System.Collections.Generic;

namespace Shopora.API.Models
{
    public class Cart
    {
        public int CartId { get; set; }

        public string UserName { get; set; } = string.Empty;

        public string UserNumber { get; set; } = string.Empty;

        public int UserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // User relationship
        public User? User { get; set; }

        // Cart items
        public List<CartItem> CartItems { get; set; } = new List<CartItem>();
    }
}