using Microsoft.AspNetCore.Cryptography.KeyDerivation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shopora.API.Data;
using Shopora.API.Models;
using System.Security.Cryptography;

namespace Shopora.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest request)
        {
            // Check if email already exists
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already registered.");
            }

            // Create password hash
            string passwordHash = HashPassword(request.Password);

            // Create User
            var user = new User
            {
                Email = request.Email,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);

            await _context.SaveChangesAsync();

            // Create User Profile
            var profile = new UserProfile
            {
                UserId = user.UserId,
                Name = request.Name,
                Phone = request.Phone
            };

            _context.UserProfiles.Add(profile);

            // Create Cart automatically
            var cart = new Cart
            {
                UserId = user.UserId,
                UserName = request.Name,
                UserNumber = request.Phone,
                CreatedAt = DateTime.Now
            };

            _context.Carts.Add(cart);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Registration successful.",
                userId = user.UserId,
                name = request.Name,
                email = user.Email,
                phone = request.Phone,
                cartId = cart.CartId
            });
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.UserProfile)
                .Include(u => u.Cart)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null)
            {
                return Unauthorized("Invalid email or password.");
            }

            bool passwordValid = VerifyPassword(
                request.Password,
                user.PasswordHash
            );

            if (!passwordValid)
            {
                return Unauthorized("Invalid email or password.");
            }

            return Ok(new
            {
                message = "Login successful.",
                userId = user.UserId,
                email = user.Email,
                name = user.UserProfile?.Name,
                phone = user.UserProfile?.Phone,
                cartId = user.Cart?.CartId
            });
        }

        // Password hashing
        private static string HashPassword(string password)
        {
            byte[] salt = RandomNumberGenerator.GetBytes(16);

            string hash = Convert.ToBase64String(
                KeyDerivation.Pbkdf2(
                    password: password,
                    salt: salt,
                    prf: KeyDerivationPrf.HMACSHA256,
                    iterationCount: 100000,
                    numBytesRequested: 32
                )
            );

            return $"{Convert.ToBase64String(salt)}.{hash}";
        }

        // Password verification
        private static bool VerifyPassword(
            string password,
            string storedHash)
        {
            try
            {
                var parts = storedHash.Split('.');

                if (parts.Length != 2)
                {
                    return false;
                }

                byte[] salt = Convert.FromBase64String(parts[0]);
                string storedPasswordHash = parts[1];

                string newHash = Convert.ToBase64String(
                    KeyDerivation.Pbkdf2(
                        password: password,
                        salt: salt,
                        prf: KeyDerivationPrf.HMACSHA256,
                        iterationCount: 100000,
                        numBytesRequested: 32
                    )
                );

                return CryptographicOperations.FixedTimeEquals(
                    Convert.FromBase64String(storedPasswordHash),
                    Convert.FromBase64String(newHash)
                );
            }
            catch
            {
                return false;
            }
        }
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;
    }
}