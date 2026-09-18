using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shopora.API.Data;
using Shopora.API.Models;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Shopora.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;

        public ProductsController(
            AppDbContext context,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
        }

        // GET: api/products
        // GET: api/products?category=electronics&search=bag
        // Optional filters are applied in the database so the frontend does not
        // have to download and filter the whole catalogue.
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts(
            [FromQuery] string? category,
            [FromQuery] string? search)
        {
            IQueryable<Product> query = _context.Products;

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(p => p.Category == category);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string term = search.Trim();

                query = query.Where(p =>
                    p.Title.Contains(term) ||
                    p.Description.Contains(term) ||
                    p.Category.Contains(term));
            }

            return await query.ToListAsync();
        }

        // GET: api/products/categories
        // The real categories stored in the database, so the navbar never has to
        // hardcode a category list that does not match the catalogue.
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<string>>> GetCategories()
        {
            var categories = await _context.Products
                .Where(p => p.Category != string.Empty)
                .Select(p => p.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(categories);
        }

        // GET: api/products/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            return product;
        }

        // GET: api/products/1/related
        // Other products in the same category, used by the product details page.
        [HttpGet("{id}/related")]
        public async Task<ActionResult<IEnumerable<Product>>> GetRelatedProducts(
            int id,
            [FromQuery] int take = 4)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound("Product not found.");
            }

            var related = await _context.Products
                .Where(p => p.Category == product.Category && p.Id != product.Id)
                .Take(take)
                .ToListAsync();

            return Ok(related);
        }

        // POST: api/products/import
        [HttpPost("import")]
        public async Task<IActionResult> ImportProducts()
        {
            // Check if products already exist
            if (await _context.Products.AnyAsync())
            {
                return Ok(new
                {
                    message = "Products already exist in database.",
                    count = await _context.Products.CountAsync()
                });
            }

            // Get products from FakeStore API
            var imported = await _httpClient.GetFromJsonAsync<List<FakeStoreProduct>>(
                "https://fakestoreapi.com/products"
            );

            if (imported == null || imported.Count == 0)
            {
                return BadRequest("No products received from FakeStore API.");
            }

            // Map into our own Product model. The rating arrives as a nested
            // object, so it has to be flattened onto RatingRate / RatingCount.
            var products = imported.Select(source => new Product
            {
                Id = 0,
                Title = source.Title,
                Price = source.Price,
                Description = source.Description,
                Category = source.Category,
                Image = source.Image,
                RatingRate = source.Rating?.Rate ?? 0,
                RatingCount = source.Rating?.Count ?? 0
            }).ToList();

            _context.Products.AddRange(products);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Products imported successfully.",
                count = products.Count
            });
        }
    }

    // Shape of a product as returned by fakestoreapi.com.
    public class FakeStoreProduct
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("price")]
        public decimal Price { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = string.Empty;

        [JsonPropertyName("image")]
        public string Image { get; set; } = string.Empty;

        [JsonPropertyName("rating")]
        public FakeStoreRating? Rating { get; set; }
    }

    public class FakeStoreRating
    {
        [JsonPropertyName("rate")]
        public double Rate { get; set; }

        [JsonPropertyName("count")]
        public int Count { get; set; }
    }
}
