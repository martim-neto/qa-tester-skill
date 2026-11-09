# Swag Labs web shop — Functional requirements (EXAMPLE)

> Made-up requirements for practising with the QA tester skills against the
> public demo site https://www.saucedemo.com. They are **not** an official spec.
> Some requirements are deliberately vague or incomplete, so the review stage
> has something to find.
>
> Test accounts are listed on the site's login page (e.g. `standard_user`,
> `locked_out_user`, `problem_user`); all share the password shown there.

## Authentication

**FR-01** — A registered user must be able to log in with a valid username and
password. After logging in, the user is taken to the products page.

**FR-02** — If the username or password is wrong, the system must show an error
message and the user must stay on the login page.

**FR-03** — A user whose account is locked must not be able to log in and must
be informed that the account is locked.

**FR-04** — A logged-in user must be able to log out from the side menu. After
logging out, the user is returned to the login page.

## Products

**FR-05** — The products page must list all available products with name,
description, price and an image.

**FR-06** — The user must be able to sort products by name (A to Z, Z to A) and
by price (low to high, high to low).

**FR-07** — The products page should load fast and be user-friendly.

## Cart

**FR-08** — The user must be able to add a product to the cart from the
products page. The cart icon must show the number of items in the cart.

**FR-09** — The user must be able to remove a product from the cart, either
from the products page or from the cart page, and the cart counter must update.

## Checkout

**FR-10** — To check out, the user must enter first name, last name and postal
code. All three fields are mandatory.

**FR-11** — Before confirming the order, the user sees an overview with the
items, the item total, tax and the final total.

**FR-12** — After finishing the order, a confirmation message is shown and the
cart is emptied. Orders above a certain value get free shipping.
