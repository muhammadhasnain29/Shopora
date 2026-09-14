using System;
using System.Collections.Generic;

namespace Shopora.API.Models
{
    public class Order
    {
        public int OrderId { get; set; }

        // Human friendly order number, e.g. SHO-2026-00001
        public string OrderNumber { get; set; } = string.Empty;

        public int UserId { get; set; }

        public decimal Subtotal { get; set; }

        public decimal DeliveryCharge { get; set; }

        public decimal GrandTotal { get; set; }

        // Pending -> Confirmed / Paid
        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        // Relationships
        public User? User { get; set; }

        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();

        public BillingDetail? BillingDetail { get; set; }

        public Payment? Payment { get; set; }
    }
}
