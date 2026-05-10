/**
 * Test file to verify server-side formatting utilities
 */

import { createServerFormatter } from '@/lib/utils/formatting';

// Test German formatting
const deFormatter = createServerFormatter('de');
console.log('German Currency:', deFormatter.formatCurrency(15000));
console.log('German Date:', deFormatter.formatDateShort('2024-08-15'));
console.log('German Number:', deFormatter.formatNumber(1234.56));

// Test English formatting  
const enFormatter = createServerFormatter('en');
console.log('English Currency:', enFormatter.formatCurrency(15000));
console.log('English Date:', enFormatter.formatDateShort('2024-08-15'));
console.log('English Number:', enFormatter.formatNumber(1234.56));

export { };