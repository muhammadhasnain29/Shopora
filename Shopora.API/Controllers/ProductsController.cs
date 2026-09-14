using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shopora.API.Data;
using Shopora.API.Models;
using System.Net.Http.Json;

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
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            return await _context.Products.ToListAsync();
        }

        // GET: api/products/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            return product;
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
            var products = await _httpClient.GetFromJsonAsync<List<Product>>(
                "https://fakestoreapi.com/products"
            );

            if (products == null || products.Count == 0)
            {
                return BadRequest("No products received from FakeStore API.");
            }

            // Reset Id so SQL Server generates Identity Id automatically
            foreach (var product in products)
            {
                product.Id = 0;
            }

            // Save products to SQL Server
            _context.Products.AddRange(products);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Products imported successfully.",
                count = products.Count
            });
        }
    }
}