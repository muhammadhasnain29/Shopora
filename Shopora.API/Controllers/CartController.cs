using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shopora.API.Data;
using Shopora.API.Models;

namespace Shopora.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CartController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CartController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/cart
        // Create a new cart
        [HttpPost]
        public async Task<ActionResult<Cart>> CreateCart(Cart cart)
        {
            cart.CreatedAt = DateTime.Now;

            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return Ok(cart);
        }

        // GET: api/cart
        // Get all carts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cart>>> GetCarts()
        {
            var carts = await _context.Carts
                .Include(c => c.CartItems)
                .ToListAsync();

            return Ok(carts);
        }

        // GET: api/cart/user/5
        // Resolves the cart that belongs to a user, creating one if the account
        // does not have a cart yet. The frontend uses this instead of trusting a
        // CartId it remembered from an earlier session, which is what used to let
        // a stale cart follow the wrong user around.
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<Cart>> GetCartForUser(int userId)
        {
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null)
            {
                cart = new Cart
                {
                    UserId = user.UserId,
                    UserName = user.UserProfile?.Name ?? string.Empty,
                    UserNumber = user.UserProfile?.Phone ?? string.Empty,
                    CreatedAt = DateTime.Now
                };

                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();
            }

            return Ok(cart);
        }

        // GET: api/cart/1
        // GET: api/cart/1?userId=5
        // Get one cart with its items. When userId is supplied the cart is only
        // returned if it actually belongs to that user.
        [HttpGet("{id}")]
        public async Task<ActionResult<Cart>> GetCart(int id, [FromQuery] int? userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.CartId == id);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            if (userId.HasValue && cart.UserId != userId.Value)
            {
                return StatusCode(403, "This cart does not belong to the current user.");
            }

            return Ok(cart);
        }

        // POST: api/cart/1/items
        // POST: api/cart/1/items?userId=5
        // Add product to cart
        [HttpPost("{cartId}/items")]
        public async Task<ActionResult<CartItem>> AddToCart(
            int cartId,
            CartItem cartItem,
            [FromQuery] int? userId)
        {
            var cart = await _context.Carts.FindAsync(cartId);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            if (userId.HasValue && cart.UserId != userId.Value)
            {
                return StatusCode(403, "This cart does not belong to the current user.");
            }

            var product = await _context.Products
                .FindAsync(cartItem.ProductId);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            int quantity = cartItem.Quantity < 1 ? 1 : cartItem.Quantity;

            // Check if product already exists in cart
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.CartId == cartId &&
                    x.ProductId == cartItem.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += quantity;
                existingItem.Price = product.Price;

                await _context.SaveChangesAsync();

                return Ok(existingItem);
            }

            var newItem = new CartItem
            {
                CartId = cartId,
                ProductId = product.Id,
                ProductName = product.Title,
                Price = product.Price,
                Quantity = quantity
            };

            _context.CartItems.Add(newItem);

            await _context.SaveChangesAsync();

            return Ok(newItem);
        }

        // PUT: api/cart/items/1
        // PUT: api/cart/items/1?userId=5
        // Update quantity
        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateQuantity(
            int cartItemId,
            [FromBody] int quantity,
            [FromQuery] int? userId)
        {
            var item = await _context.CartItems
                .Include(i => i.Cart)
                .FirstOrDefaultAsync(i => i.CartItemId == cartItemId);

            if (item == null)
            {
                return NotFound("Cart item not found.");
            }

            if (userId.HasValue && item.Cart?.UserId != userId.Value)
            {
                return StatusCode(403, "This cart does not belong to the current user.");
            }

            if (quantity < 1)
            {
                return BadRequest("Quantity must be at least 1.");
            }

            item.Quantity = quantity;

            await _context.SaveChangesAsync();

            return Ok(item);
        }

        // DELETE: api/cart/items/1
        // DELETE: api/cart/items/1?userId=5
        // Remove item from cart
        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(
            int cartItemId,
            [FromQuery] int? userId)
        {
            var item = await _context.CartItems
                .Include(i => i.Cart)
                .FirstOrDefaultAsync(i => i.CartItemId == cartItemId);

            if (item == null)
            {
                return NotFound("Cart item not found.");
            }

            if (userId.HasValue && item.Cart?.UserId != userId.Value)
            {
                return StatusCode(403, "This cart does not belong to the current user.");
            }

            _context.CartItems.Remove(item);

            await _context.SaveChangesAsync();

            return Ok("Item removed from cart.");
        }
    }
}
