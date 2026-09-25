# 🍕 PizzaHub — Pizza Delivery App

PizzaHub is a full-stack pizza delivery application that allows customers to browse pizzas, build custom pizzas, place orders, make payments, and track their orders.

## ✨ Features

### Customer

* User registration and email verification
* Login and password reset
* Browse pizza menu
* Custom Pizza Builder
* Select bases, sauces, cheese, and vegetables
* Real-time inventory-based ingredients
* Cart and order summary
* Safepay payment integration
* Order history and tracking
* Profile management

### Admin

* Secure admin login
* Dashboard with sales and order statistics
* Add, edit, and delete pizzas
* Manage ingredient inventory
* Set low-stock thresholds
* Manage and update orders
* Low-stock and new-order notifications
* Automated inventory monitoring

## 🛠️ Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT
* bcryptjs
* Nodemailer
* node-cron
* Safepay

## 💳 Payment

PizzaHub uses **Safepay** for online payments with sandbox support for testing.

## 📦 Order Flow

```text
ORDER_RECEIVED
      ↓
IN_KITCHEN
      ↓
SENT_TO_DELIVERY
      ↓
DELIVERED
```

Orders can also be cancelled before delivery.

## ⚙️ Setup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `.env` files for the required database, authentication, email, payment, and API configuration.

## 👨‍💻 Project

PizzaHub was developed as a full-stack project to demonstrate **e-commerce functionality, payment integration, authentication, inventory management, and order processing**.

**License:** Educational use.
