using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shopora.API.Data;
using Shopora.API.Models;

namespace Shopora.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private const decimal DeliveryCharge = 5.00m;

        private readonly AppDbContext _context;

        public OrdersController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/orders
        // Creates an order (+ items, billing details, pending payment) from the user's cart
        // and empties the cart. This is the "Place Order" step of checkout.
        [HttpPost]
        public async Task<ActionResult> CreateOrder(CreateOrderRequest request)
        {
            var user = await _context.Users.FindAsync(request.UserId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            // Resolve the cart from the user rather than trusting whatever CartId
            // the browser sent. A stale CartId left over from a previous session
            // could otherwise turn someone else's cart into this user's order.
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == user.UserId);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            if (cart.CartItems.Count == 0)
            {
                return BadRequest("Cart is empty.");
            }

            decimal subtotal = cart.CartItems.Sum(item => item.Price * item.Quantity);
            decimal grandTotal = subtotal + DeliveryCharge;

            var order = new Order
            {
                UserId = user.UserId,
                Subtotal = subtotal,
                DeliveryCharge = DeliveryCharge,
                GrandTotal = grandTotal,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.Orders.Add(order);

            // Save first so the database generates OrderId, used for the order number.
            await _context.SaveChangesAsync();

            order.OrderNumber = $"SHO-{order.CreatedAt.Year}-{order.OrderId:D5}";

            foreach (var cartItem in cart.CartItems)
            {
                _context.OrderItems.Add(new OrderItem
                {
                    OrderId = order.OrderId,
                    ProductId = cartItem.ProductId,
                    ProductName = cartItem.ProductName,
                    Price = cartItem.Price,
                    Quantity = cartItem.Quantity
                });
            }

            _context.BillingDetails.Add(new BillingDetail
            {
                OrderId = order.OrderId,
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                Address = request.Address,
                City = request.City,
                PostalCode = request.PostalCode
            });

            _context.Payments.Add(new Payment
            {
                OrderId = order.OrderId,
                Method = string.Empty,
                Status = "Pending"
            });

            // Empty the cart now that the order owns these items.
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                orderId = order.OrderId,
                orderNumber = order.OrderNumber
            });
        }

        // GET: api/orders/5
        // GET: api/orders/5?userId=3
        // When userId is supplied the order is only returned if it belongs to
        // that user, so one customer can never open another customer's order by
        // guessing an id in the URL.
        [HttpGet("{id}")]
        public async Task<ActionResult<Order>> GetOrder(int id, [FromQuery] int? userId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.BillingDetail)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (userId.HasValue && order.UserId != userId.Value)
            {
                return StatusCode(403, "This order does not belong to the current user.");
            }

            return Ok(order);
        }

        // GET: api/orders/user/5
        // All orders placed by a given user, most recent first.
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrdersForUser(int userId)
        {
            var orders = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.BillingDetail)
                .Include(o => o.Payment)
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        // PUT: api/orders/5/pay
        // Confirms the selected payment method. Bank Transfer is treated as paid
        // immediately (simulated gateway); Cash on Delivery stays pending until delivery.
        [HttpPut("{id}/pay")]
        public async Task<ActionResult<Order>> ConfirmPayment(
            int id,
            ConfirmPaymentRequest request,
            [FromQuery] int? userId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.BillingDetail)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null)
            {
                return NotFound("Order not found.");
            }

            if (userId.HasValue && order.UserId != userId.Value)
            {
                return StatusCode(403, "This order does not belong to the current user.");
            }

            if (order.Payment == null)
            {
                return BadRequest("Order has no payment record.");
            }

            bool isCashOnDelivery = request.PaymentMethod == "Cash on Delivery";

            order.Payment.Method = request.PaymentMethod;
            order.Payment.Status = isCashOnDelivery
                ? "Pending (Cash on Delivery)"
                : "Paid";
            order.Payment.PaidAt = isCashOnDelivery ? null : DateTime.Now;

            order.Status = isCashOnDelivery ? "Confirmed" : "Paid";

            await _context.SaveChangesAsync();

            return Ok(order);
        }
    }

    public class CreateOrderRequest
    {
        public int UserId { get; set; }

        public int CartId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public string City { get; set; } = string.Empty;

        public string PostalCode { get; set; } = string.Empty;
    }

    public class ConfirmPaymentRequest
    {
        public string PaymentMethod { get; set; } = string.Empty;
    }
}
