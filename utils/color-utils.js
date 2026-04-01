
/**
 * Utility to get marker background color based on marker type
 * @param {string} type - Marker type (ENTRY, EXIT, TARGET)
 * @returns {string} - CSS color value
 */
export const getChartMarkerBg = (type) => {
    if (typeof window === 'undefined') return '#6366f1';
    const root = getComputedStyle(document.documentElement);
    let color = '';
    switch (type) {
        case 'ENTRY':
            color = root.getPropertyValue('--color-entry').trim();
            break;
        case 'EXIT':
            color = root.getPropertyValue('--color-exit').trim();
            break;
        case 'TARGET':
            color = root.getPropertyValue('--color-target').trim();
            break;
        default:
            color = root.getPropertyValue('--p-purple-500').trim();
    }
    return color || '#6366f1';
};

/**
 * Utility to get foreground color (black/white) based on background color contrast
 * @param {string} bgColor - Background color in hex or rgb format
 * @returns {string} - #000000 or #ffffff
 */
export const getChartMarkerFg = (bgColor) => {
    if (!bgColor) return '#ffffff';
    
    let r, g, b;
    
    // Handle rgb(r, g, b) or rgba(r, g, b, a)
    if (bgColor.startsWith('rgb')) {
        const match = bgColor.match(/\d+/g);
        if (match) {
            r = parseInt(match[0]);
            g = parseInt(match[1]);
            b = parseInt(match[2]);
        }
    } 
    // Handle #rrggbb or #rgb
    else if (bgColor.startsWith('#')) {
        let hex = bgColor.slice(1);
        if (hex.length === 3) {
            hex = hex.split('').map(char => char + char).join('');
        }
        r = parseInt(hex.substring(0, 2), 16);
        g = parseInt(hex.substring(2, 4), 16);
        b = parseInt(hex.substring(4, 6), 16);
    }
    
    // If we couldn't parse it, default to white
    if (r === undefined || isNaN(r)) return '#ffffff';
    
    // HSP color model formula for perceived brightness
    // http://alienryderflex.com/hsp.html
    const hsp = Math.sqrt(
        0.299 * (r * r) +
        0.587 * (g * g) +
        0.114 * (b * b)
    );
    
    // Standard threshold is 127.5
    return hsp > 127.5 ? '#000000' : '#ffffff';
};
