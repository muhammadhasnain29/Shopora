namespace Shopora.API.Models
{
    public class UserProfile
    {
        public int ProfileId { get; set; }

        public int UserId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string Phone { get; set; } = string.Empty;

        // Relationship with User
        public User? User { get; set; }
    }
}
