import { useEffect, useState } from "react";

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const cartId = 2;

  useEffect(() => {
    fetch(`http://localhost:5256/api/cart/${cartId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch cart");
        }

        return response.json();
      })
      .then((data) => {
        setCart(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Cart error:", error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <h2>Loading cart...</h2>;
  }

  if (!cart) {
    return <h2>Cart not found</h2>;
  }

  const total = cart.cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-page">

      <h1>My Cart</h1>

      <p>
        <strong>Name:</strong> {cart.userName}
      </p>

      <p>
        <strong>Phone:</strong> {cart.userNumber}
      </p>

      {cart.cartItems.length === 0 ? (
        <h2>Your cart is empty</h2>
      ) : (
        <>
          {cart.cartItems.map((item) => (
            <div className="cart-item" key={item.cartItemId}>

              <div>
                <h3>{item.productName}</h3>

                <p>
                  Price: ${item.price}
                </p>

                <p>
                  Quantity: {item.quantity}
                </p>

                <p>
                  Subtotal: $
                  {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>

            </div>
          ))}

          <hr />

          <h2>
            Total: ${total.toFixed(2)}
          </h2>
        </>
      )}
    </div>
  );
}

export default Cart;