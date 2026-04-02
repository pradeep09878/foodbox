# FoodBox Mobile

A React Native food delivery app built with Expo, supporting two roles: **customers** who browse and order food, and **vendors/restaurants** who manage menus and incoming orders.

---

## Features

### Customer
- Browse and search restaurants by name or cuisine type
- View restaurant menus and item details
- Add items to cart (single-vendor enforcement)
- Place and track orders with live status updates
- View order history
- Manage profile

### Vendor / Restaurant
- Dashboard with today's orders, revenue, and active order count
- Toggle restaurant open/closed status in real time
- Manage menu items (add, edit, toggle availability, mark veg/non-veg)
- Accept and progress orders through status stages: `pending → confirmed → preparing → ready`
- View full order history
- Manage restaurant profile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.74 + Expo SDK 51 |
| Navigation | Expo Router (file-based routing) |
| Language | TypeScript |
| State / Auth | React Context API + AsyncStorage |
| HTTP Client | Axios |
| UI | Custom components, Expo Linear Gradient, @expo/vector-icons |

---

## Project Structure

```
mobile/
├── app/
│   ├── index.tsx              # Landing screen (role selection)
│   ├── _layout.tsx            # Root layout with auth guards
│   ├── (auth)/                # Login & registration screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── vendor-login.tsx
│   │   └── vendor-register.tsx
│   ├── (user)/                # Customer screens
│   │   ├── home.tsx           # Restaurant listing + search + cuisine filter
│   │   ├── restaurant/[id].tsx # Menu view for a restaurant
│   │   ├── cart.tsx
│   │   ├── orders.tsx
│   │   └── profile.tsx
│   └── (vendor)/              # Vendor screens
│       ├── dashboard.tsx      # Stats + pending orders
│       ├── menu.tsx
│       ├── orders.tsx
│       └── profile.tsx
├── components/
│   ├── VendorCard.tsx
│   ├── MenuItemCard.tsx
│   └── OrderCard.tsx
├── context/
│   ├── AuthContext.tsx         # Auth state, login/register/logout
│   └── CartContext.tsx         # Cart state, add/remove/clear
├── services/
│   └── api.ts                  # Axios instance with auth interceptor
└── constants/
    └── Colors.ts               # App color palette + order status colors
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- [Expo Go](https://expo.dev/go) app on your Android/iOS device

### Install dependencies

```bash
npm install
```

### Configure the API

The app points to a hosted API by default. To run against a local backend, edit [services/api.ts](services/api.ts):

```ts
// Replace with your machine's local IP (run `ipconfig` on Windows to find it)
const API_BASE_URL = 'http://192.168.1.100:3000/api';
```

### Run the dev server

```bash
npx expo start
```

Scan the QR code with **Expo Go** on your device (must be on the same Wi-Fi network).

---

## Building an APK (for testing without Expo Go)

Uses [EAS Build](https://docs.expo.dev/build/introduction/) — free tier available.

```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login to your Expo account
eas login

# 3. Configure EAS (first time only)
eas build:configure

# 4. Build APK
eas build -p android --profile preview
```

Add a `preview` profile to `eas.json` to get an `.apk` (installable) instead of `.aab`:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Download the APK from the link provided after the build completes.

---

## Authentication Flow

- JWT token is stored in `AsyncStorage` alongside `authType` (`"user"` or `"vendor"`)
- On app launch, stored credentials are restored automatically
- Route guards in [app/_layout.tsx](app/_layout.tsx) redirect users to the correct section based on their role
- Logging out clears all stored credentials and returns to the landing screen

## Order Status Flow

```
pending → confirmed → preparing → ready → delivered
                                        ↘ cancelled
```
