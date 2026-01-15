// BillSnap License System
// Simple offline license key validation for BillSnap Invoice Generator

class LicenseManager {
  constructor() {
    this.TRIAL_LIMIT = 10;
    this.LICENSE_KEY_PREFIX = 'BILLSNAP';
    this.storageKey = 'billsnap_license';
    this.init();
  }

  init() {
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.licenseData = JSON.parse(stored);
    } else {
      this.licenseData = {
        type: 'trial',
        invoicesCreated: 0,
        activatedAt: null,
        key: null
      };
      this.save();
    }
  }

  save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.licenseData));
  }

  validateKey(key) {
    // Format: BILLSNAP-XXXX-XXXX-XXXX-XXXX
    if (!key || typeof key !== 'string') return false;
    
    const parts = key.toUpperCase().split('-');
    if (parts.length !== 5) return false;
    if (parts[0] !== this.LICENSE_KEY_PREFIX) return false;
    
    // Check each part is 4 alphanumeric characters
    for (let i = 1; i < 5; i++) {
      if (!/^[A-Z0-9]{4}$/.test(parts[i])) return false;
    }
    
    // Simple checksum validation
    const checksum = this.calculateChecksum(parts.slice(1, 4).join(''));
    return parts[4] === checksum;
  }

  calculateChecksum(str) {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
      sum += str.charCodeAt(i);
    }
    const check = ((sum * 7919) % 65536).toString(36).toUpperCase().padStart(4, '0').slice(0, 4);
    return check;
  }

  activateLicense(key) {
    if (this.validateKey(key)) {
      this.licenseData.type = 'licensed';
      this.licenseData.key = key;
      this.licenseData.activatedAt = new Date().toISOString();
      this.save();
      return { success: true, message: 'License activated successfully!' };
    }
    return { success: false, message: 'Invalid license key format' };
  }

  isLicensed() {
    return this.licenseData.type === 'licensed' && this.licenseData.key;
  }

  canCreateInvoice() {
    if (this.isLicensed()) return true;
    return this.licenseData.invoicesCreated < this.TRIAL_LIMIT;
  }

  incrementInvoiceCount() {
    if (!this.isLicensed()) {
      this.licenseData.invoicesCreated++;
      this.save();
    }
  }

  getRemainingTrialInvoices() {
    if (this.isLicensed()) return Infinity;
    return Math.max(0, this.TRIAL_LIMIT - this.licenseData.invoicesCreated);
  }

  getStatus() {
    return {
      type: this.licenseData.type,
      isLicensed: this.isLicensed(),
      canCreate: this.canCreateInvoice(),
      remaining: this.getRemainingTrialInvoices(),
      invoicesCreated: this.licenseData.invoicesCreated,
      trialLimit: this.TRIAL_LIMIT
    };
  }

  generateSampleKey() {
    // Generate a valid sample key for testing
    const randomPart = () => Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, '0');
    const part1 = randomPart();
    const part2 = randomPart();
    const part3 = randomPart();
    const checksum = this.calculateChecksum(part1 + part2 + part3);
    return `${this.LICENSE_KEY_PREFIX}-${part1}-${part2}-${part3}-${checksum}`;
  }

  showLicenseModal() {
    const status = this.getStatus();
    const modalHTML = `
      <div id="licenseModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: white; padding: 32px; border-radius: 12px; max-width: 500px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
          <h2 style="margin: 0 0 16px 0; color: #1e40af; font-size: 24px;">
            ${status.isLicensed ? '✓ Licensed' : '🔑 Activate License'}
          </h2>
          ${status.isLicensed ? `
            <p style="color: #16a34a; margin: 16px 0;">Your license is active!</p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">Key: ${this.licenseData.key}</p>
            <p style="color: #6b7280; font-size: 14px; margin: 8px 0;">Activated: ${new Date(this.licenseData.activatedAt).toLocaleDateString()}</p>
          ` : `
            <p style="color: #dc2626; margin: 16px 0; font-weight: 600;">
              Trial: ${status.remaining}/${status.trialLimit} invoices remaining
            </p>
            <p style="color: #6b7280; margin: 16px 0;">Enter your license key to unlock unlimited invoices:</p>
            <input type="text" id="licenseKeyInput" placeholder="BILLSNAP-XXXX-XXXX-XXXX-XXXX" 
              style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 14px; font-family: monospace; text-transform: uppercase; margin: 8px 0;" 
              maxlength="29">
            <div id="licenseError" style="color: #dc2626; font-size: 14px; margin: 8px 0; min-height: 20px;"></div>
          `}
          <div style="display: flex; gap: 12px; margin-top: 24px;">
            ${!status.isLicensed && status.canCreate ? `
              <button onclick="window.closeLicenseModal()" 
                style="flex: 1; padding: 12px; background: #e5e7eb; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; color: #374151;">
                Continue Trial
              </button>
            ` : ''}
            ${!status.isLicensed ? `
              <button onclick="window.activateLicense()" 
                style="flex: 1; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Activate
              </button>
            ` : `
              <button onclick="window.closeLicenseModal()" 
                style="flex: 1; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Close
              </button>
            `}
          </div>
          ${!status.isLicensed ? `
            <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0; text-align: center;">
              Need a license? Contact: support@billsnap.app
            </p>
          ` : ''}
        </div>
      </div>
    `;

      showLicenseGate() {
    // Mandatory license gate - no skip option
    const modalHTML = `
      <div id="licenseGateModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.95); z-index: 99999; display: flex; align-items: center; justify-content: center; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: white; padding: 48px; border-radius: 16px; max-width: 500px; width: 90%; box-shadow: 0 25px 80px rgba(0,0,0,0.5); text-align: center;">
          <div style="font-size: 64px; margin-bottom: 16px;">🔒</div>
          <h2 style="margin: 0 0 16px 0; color: #1e40af; font-size: 32px; font-weight: 700;">BillSnap</h2>
          <p style="color: #6b7280; margin: 16px 0 32px 0; font-size: 16px;">Enter your license key to access the application</p>
          <input type="text" id="licenseGateInput" placeholder="BILLSNAP-XXXX-XXXX-XXXX-XXXX" 
            style="width: 100%; padding: 16px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 16px; font-family: monospace; text-transform: uppercase; margin-bottom: 12px; box-sizing: border-box; text-align: center; font-weight: 600;" 
            maxlength="29" autofocus>
          <div id="licenseGateError" style="color: #dc2626; font-size: 14px; margin: 12px 0; min-height: 24px; font-weight: 600;"></div>
          <button onclick="window.validateAndActivateLicense()" 
            style="width: 100%; padding: 16px; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3); transition: all 0.2s;" 
            onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 16px rgba(37, 99, 235, 0.4)';" 
            onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 4px 12px rgba(37, 99, 235, 0.3)';">
            🚀 Activate License
          </button>
          <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0 0;">
            Need a license key? Contact <strong>support@billsnap.app</strong>
          </p>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  closeLicenseModal() {
    const modal = document.getElementById('licenseModal');
    if (modal) modal.remove();
  }
}

// Global instance
window.licenseManager = new LicenseManager();

// Global helper functions
window.activateLicense = function() {
  const input = document.getElementById('licenseKeyInput');
  const error = document.getElementById('licenseError');
  const key = input.value.trim().toUpperCase();
  
  const result = window.licenseManager.activateLicense(key);
  if (result.success) {
    window.licenseManager.closeLicenseModal();
    alert(result.message + ' Reloading...');
    location.reload();
  } else {
    error.textContent = result.message;
  }
};

// Gate-specific activation function
window.validateAndActivateLicense = function() {
  const input = document.getElementById('licenseGateInput');
  const error = document.getElementById('licenseGateError');
  const key = input.value.trim().toUpperCase();
  
  if (!key) {
    error.textContent = '⚠️ Please enter a license key';
    return;
  }
  
  const result = window.licenseManager.activateLicense(key);
  if (result.success) {
    // Remove the gate modal
    const modal = document.getElementById('licenseGateModal');
    if (modal) modal.remove();
    // Show the app
    document.getElementById('app').style.display = 'block';
    // Success message
    alert('✅ License activated successfully! Welcome to BillSnap.');
  } else {
    error.textContent = '❌ Invalid license key. Please check and try again.';
    input.style.borderColor = '#dc2626';
    setTimeout(() => {
      input.style.borderColor = '#e5e7eb';
    }, 2000);
  }
};

window.closeLicenseModal = function() {
  window.licenseManager.closeLicenseModal();
};

window.checkLicense = function() {
  const status = window.licenseManager.getStatus();
  if (!status.canCreate) {
    window.licenseManager.showLicenseModal();
    return false;
  }
  return true;
};

// Generate and log a test key on load
console.log('Sample License Key:', window.licenseManager.generateSampleKey());
console.log('License Status:', window.licenseManager.getStatus());
