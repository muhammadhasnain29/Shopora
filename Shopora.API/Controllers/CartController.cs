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

        // GET: api/cart/1
        // Get one cart with its items
        [HttpGet("{id}")]
        public async Task<ActionResult<Cart>> GetCart(int id)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.CartId == id);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            return Ok(cart);
        }

        // POST: api/cart/1/items
        // Add product to cart
        [HttpPost("{cartId}/items")]
        public async Task<ActionResult<CartItem>> AddToCart(
            int cartId,
            CartItem cartItem)
        {
            var cart = await _context.Carts.FindAsync(cartId);

            if (cart == null)
            {
                return NotFound("Cart not found.");
            }

            var product = await _context.Products
                .FindAsync(cartItem.ProductId);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            // Check if product already exists in cart
            var existingItem = await _context.CartItems
                .FirstOrDefaultAsync(x =>
                    x.CartId == cartId &&
                    x.ProductId == cartItem.ProductId);

            if (existingItem != null)
            {
                existingItem.Quantity += cartItem.Quantity;
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
                Quantity = cartItem.Quantity
            };

            _context.CartItems.Add(newItem);

            await _context.SaveChangesAsync();

            return Ok(newItem);
        }
         


        // PUT: api/cart/items/1
        // Update quantity
        [HttpPut("items/{cartItemId}")]
        public async Task<IActionResult> UpdateQuantity(
            int cartItemId,
            [FromBody] int quantity)
        {
            var item = await _context.CartItems
                .FindAsync(cartItemId);

            if (item == null)
            {
                return NotFound("Cart item not found.");
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
        // Remove item from cart
        [HttpDelete("items/{cartItemId}")]
        public async Task<IActionResult> RemoveFromCart(int cartItemId)
        {
            var item = await _context.CartItems
                .FindAsync(cartItemId);

            if (item == null)
            {
                return NotFound("Cart item not found.");
            }

            _context.CartItems.Remove(item);

            await _context.SaveChangesAsync();

            return Ok("Item removed from cart.");
        }
    }
}