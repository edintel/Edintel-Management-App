export function generateUniqueMessageId(prefix = 'MSG') {
    // Get current timestamp in milliseconds
    const timestamp = Date.now();
    
    // Generate a random component (6 characters)
    const randomStr = Math.random().toString(36).substring(2, 8);
    
    // Create a counter that resets each millisecond
    const counter = (function() {
        let count = 0;
        let lastTimestamp = timestamp;
        
        return function() {
            if (Date.now() !== lastTimestamp) {
                count = 0;
                lastTimestamp = Date.now();
            }
            return (count++).toString(36);
        };
    })();
    
    // Get process unique component (using performance.now() for microsecond precision)
    const processUnique = performance.now().toString(36).replace('.', '');
    
    // Combine all components with the prefix
    const messageId = `${prefix}-${timestamp}-${randomStr}-${counter()}-${processUnique}`;
    
    // Add domain for email compliance (replace example.com with your actual domain)
    const emailCompliantId = `${messageId}@edintel.com`;
    
    return {
        messageId: messageId,           // Basic unique ID
        emailCompliantId: emailCompliantId  // Email-compliant format
    };
}

export function generateRandomNumber(length) {
    if (length <= 0 || !Number.isInteger(length)) {
      throw new Error('Length must be a positive integer');
    }
    
    // Generate random number between 0 and 1, multiply by 10^length, and floor it
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    
    // Generate random number within range
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }