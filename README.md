# BillSnap-Web
Web version of BillSnap invoice generator built with React + Vite for browser deployment

## 🔐 License System

BillSnap uses Lemon Squeezy for license key management and validation.

### Setting Up Lemon Squeezy Integration

1. **Create a Lemon Squeezy Account**
   - Go to [Lemon Squeezy](https://www.lemonsqueezy.com/) and create an account
   - Set up your store

2. **Create a Product**
   - Create a new product for BillSnap
   - Enable license keys for the product
   - Note down your Store ID and Product ID

3. **Configure the License System**
   - Open `license-system.js`
   - Replace the following placeholders:
     ```javascript
     this.LEMON_SQUEEZY_STORE_ID = 'YOUR_STORE_ID';
     this.LEMON_SQUEEZY_PRODUCT_ID = 'YOUR_PRODUCT_ID';
     ```

4. **Update Purchase Link**
   - In `license-system.js`, update the purchase link in the `showLicenseGate()` function:
     ```javascript
     <a href="https://billsnap.lemonsqueezy.com" target="_blank">
     ```
   - Replace with your actual Lemon Squeezy store URL

### How It Works

- When users first open BillSnap, they see a license activation gate
- Users enter their license key purchased from Lemon Squeezy
- The app validates the key using Lemon Squeezy's API
- Valid licenses unlock full access to the invoice generator
- License data is stored locally in browser localStorage
- The system checks for license expiration automatically

### Testing

To test the license system:
1. Purchase a license from your Lemon Squeezy store
2. Copy the license key from your email
3. Enter it in the BillSnap license gate
4. The app should activate and show the invoice generator

## 📦 Features

- Professional invoice generation for Indian kirana stores
- GST-compliant invoice format
- Item-wise pricing with automatic calculations
- PDF download functionality
- Responsive design for all devices
