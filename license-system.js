class LicenseManager {
  constructor() {
    this.storageKey = 'billsnap_license';
    this.LEMON_SQUEEZY_STORE_ID = 'YOUR_STORE_ID'; // Replace with your store ID
    this.LEMON_SQUEEZY_PRODUCT_ID = 'YOUR_PRODUCT_ID'; // Replace with your product ID
    this.licenseData = null;
    this.init();
  }

  init() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.licenseData = JSON.parse(stored);
    } else {
      this.licenseData = {
        type: 'unlicensed',
        key: null,
        activatedAt: null,
        customerEmail: null,
        validUntil: null
      };
      this.save();
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.licenseData));
  }

  async activateLicense(key) {
    if (!key || typeof key !== 'string') {
      return { success: false, message: 'Please enter a valid license key' };
    }

    try {
      // Call Lemon Squeezy API to validate license
      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          license_key: key,
          instance_name: window.location.hostname || 'billsnap-web'
        })
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // License is valid
        this.licenseData.type = 'licensed';
        this.licenseData.key = key;
        this.licenseData.activatedAt = new Date().toISOString();
        this.licenseData.customerEmail = data.meta?.customer_email || null;
        this.licenseData.validUntil = data.license_key?.expires_at || null;
        this.save();
        
        return { 
          success: true, 
          message: 'License activated successfully!',
          data: {
            customerName: data.meta?.customer_name,
            productName: data.meta?.product_name,
            expiresAt: data.license_key?.expires_at
          }
        };
      } else {
        // License is invalid
        return { 
          success: false, 
          message: data.error || 'Invalid license key. Please check and try again.'
        };
      }
    } catch (error) {
      console.error('License validation error:', error);
      return { 
        success: false, 
        message: 'Failed to validate license. Please check your internet connection and try again.'
      };
    }
  }

  isLicensed() {
    if (this.licenseData.type !== 'licensed' || !this.licenseData.key) {
      return false;
    }

    // Check if license has expired
    if (this.licenseData.validUntil) {
      const expiryDate = new Date(this.licenseData.validUntil);
      if (expiryDate < new Date()) {
        return false;
      }
    }

    return true;
  }

  getLicenseInfo() {
    return {
      isLicensed: this.isLicensed(),
      customerEmail: this.licenseData.customerEmail,
      activatedAt: this.licenseData.activatedAt,
      validUntil: this.licenseData.validUntil
    };
  }

  deactivateLicense() {
    this.licenseData = {
      type: 'unlicensed',
      key: null,
      activatedAt: null,
      customerEmail: null,
      validUntil: null
    };
    this.save();
  }
}

// Initialize license manager
const licenseManager = new LicenseManager();

// Show license gate on page load
window.addEventListener('DOMContentLoaded', () => {
  if (!licenseManager.isLicensed()) {
    showLicenseGate();
  }
});

function showLicenseGate() {
  // Hide main app
  document.getElementById('app').style.display = 'none';

  // Create and show license modal
  const modal = document.createElement('div');
  modal.id = 'license-modal';
  modal.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
      <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
        <h2 style="margin-top: 0; color: #333;">🔐 BillSnap License Activation</h2>
        <p style="color: #666; line-height: 1.6;">Enter your license key to unlock BillSnap and start creating professional invoices for your kirana store.</p>
        <div style="margin: 20px 0;">
          <input 
            type="text" 
            id="license-key-input" 
            placeholder="Enter your license key" 
            style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box;"
          />
        </div>
        <div id="license-error" style="color: #dc3545; margin: 10px 0; display: none;"></div>
        <div id="license-success" style="color: #28a745; margin: 10px 0; display: none;"></div>
        <button 
          id="activate-btn" 
          style="width: 100%; padding: 12px; background: #4CAF50; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold;"
        >Activate License</button>
  `;
  
  
  const input = document.getElementById('license-key-input');
  const btn = document.getElementById('activate-btn');
  const errorDiv = document.getElementById('license-error');
  const successDiv = document.getElementById('license-success');

  btn.onclick = async () => {
    const key = input.value.trim();
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!key) {
      errorDiv.textContent = 'Please enter a license key';
      errorDiv.style.display = 'block';
      return;
    }

    btn.textContent = 'Validating...';
    btn.disabled = true;

    const result = await licenseManager.activateLicense(key);
    
    if (result.success) {
      successDiv.textContent = result.message;
      successDiv.style.display = 'block';
      setTimeout(() => {
        modal.remove();
        document.getElementById('app').style.display = 'block';
      }, 1500);
    } else {
      errorDiv.textContent = result.message;
      errorDiv.style.display = 'block';
      btn.textContent = 'Activate License';
      btn.disabled = false;
    }
  };

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      btn.click();
    }
  });
}
