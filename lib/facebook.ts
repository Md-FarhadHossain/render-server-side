import crypto from 'crypto';
import bizSdk from 'facebook-nodejs-business-sdk';

export const hashData = (data?: string | null): string | undefined => {
  if (!data) return undefined;
  const normalized = data.trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
};

/**
 * Normalizes email address
 */
export const normalizeEmail = (email?: string): string | undefined => {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  return trimmed;
};

/**
 * Normalizes phone number (requires country code, removes special characters)
 */
export const normalizePhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  // Remove any non-numeric characters except leading +
  let normalized = phone.replace(/[^\d+]/g, '');
  if (!normalized.startsWith('+')) {
    // Assuming a default prefix could be dangerous, best effort just numbers
    // In production, you'd want proper parsing like libphonenumber-js
    normalized = normalized.replace(/\+/g, ''); // strip plus if they just added it randomly
  }
  return normalized.replace(/\+/g, ''); // FB requires numbers only, including country code but no + sign
};

/**
 * Format FB CAPI Event
 */
export const createFacebookEvent = (
  eventName: string,
  eventId: string,
  eventTime: number,
  eventSourceUrl: string,
  clientIpAddress: string,
  clientUserAgent: string,
  fbp: string | undefined,
  fbc: string | undefined,
  userData: { email?: string; phone?: string; external_id?: string } = {},
  customData: Record<string, any> = {}
) => {
  const ServerEvent = bizSdk.ServerEvent;
  const EventRequest = bizSdk.EventRequest;
  const UserData = bizSdk.UserData;
  const CustomData = bizSdk.CustomData;

  const userDataObj = new UserData()
    .setClientIpAddress(clientIpAddress)
    .setClientUserAgent(clientUserAgent);

  if (fbp) userDataObj.setFbp(fbp);
  if (fbc) userDataObj.setFbc(fbc);
  
  if (userData.email) {
    userDataObj.setEmail(hashData(normalizeEmail(userData.email)) as string);
  }
  
  if (userData.phone) {
    userDataObj.setPhone(hashData(normalizePhone(userData.phone)) as string);
  }

  if (userData.external_id) {
    userDataObj.setExternalId(hashData(userData.external_id) as string);
  }

  const customDataObj = new CustomData();
  Object.keys(customData).forEach((key) => {
    // Helper to add typical ecommerce parameters dynamically or general ones
    if (key === 'value') customDataObj.setValue(customData[key]);
    else if (key === 'currency') customDataObj.setCurrency(customData[key]);
    else if (key === 'content_name') customDataObj.setContentName(customData[key]);
    else {
      // It's not strictly typed in business sdk for dynamic custom properties simply setting mapped
      // But we can add as custom properties
      customDataObj[key] = customData[key];
    }
  });

  const serverEvent = new ServerEvent()
    .setEventName(eventName)
    .setEventTime(eventTime)
    .setUserData(userDataObj)
    .setCustomData(customDataObj)
    .setEventSourceUrl(eventSourceUrl)
    .setActionSource('website')
    .setEventId(eventId);

  return serverEvent;
};
