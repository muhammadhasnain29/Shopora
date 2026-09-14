namespace Shopora.API.Models
{
    public class BillingDetail
    {
        public int BillingDetailId { get; set; }

        public int OrderId { get; set; }

        public Order? Order { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string PostalCode { get; set; } = string.Empty;
    }
}
