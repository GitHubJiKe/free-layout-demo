// Polyfills for Node.js environment
if (typeof global === 'undefined') {
    window.global = window;
}

if (typeof process === 'undefined') {
    window.process = { env: {} };
}

// Crypto polyfill for older Node.js versions
if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
    if (typeof window !== 'undefined') {
        // Browser environment
        if (!window.crypto) {
            window.crypto = {};
        }
        if (!window.crypto.getRandomValues) {
            window.crypto.getRandomValues = function(array) {
                for (let i = 0; i < array.length; i++) {
                    array[i] = Math.floor(Math.random() * 256);
                }
                return array;
            };
        }
    }
}

// Buffer polyfill if needed
if (typeof Buffer === 'undefined') {
    if (typeof window !== 'undefined') {
        window.Buffer = {
            isBuffer: () => false
        };
    }
}
