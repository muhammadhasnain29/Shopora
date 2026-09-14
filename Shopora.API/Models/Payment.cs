using System;

namespace Shopora.API.Models
{
    public class Payment
    {
        public int PaymentId { get; set; }

        public int OrderId { get; set; }

        public Order? Order { get; set; }

        // "Cash on Delivery" or "Bank Transfer"
        public string Method { get; set; } = string.Empty;

        // "Pending", "Paid", "Pending (Cash on Delivery)"
        public string Status { get; set; } = "Pending";

        public DateTime? PaidAt { get; set; }
    }
}
