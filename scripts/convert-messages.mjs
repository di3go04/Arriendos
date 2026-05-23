import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

function setNested(result, keys, value) {
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // If current[key] is a string, we have a conflict: need to convert
        // e.g. features.properties -> "Immobilienverwaltung" (string)
        // but features.properties.desc needs to go under features.properties (object)
        if (typeof current[key] === 'string') {
            // Move the string value to "title" sub-key
            current[key] = { title: current[key] };
        }
        if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    const lastKey = keys[keys.length - 1];
    // If the key already exists as an object, this means we're trying to set
    // e.g. "features.properties.title" but "features.properties" is already an object
    // In that case, we should respect the existing object
    if (typeof current[lastKey] === 'object' && !Array.isArray(current[lastKey])) {
        // Don't overwrite object with string - this means we have a conflict
        // e.g. "features.properties" wants to be both "Immobilienverwaltung" and {...}
        // We already handled this above by converting the string to {title: string}
        // So just skip setting the value
        return;
    }
    current[lastKey] = value;
}

function flatToNested(obj) {
    const result = {};
    // Process keys sorted to ensure parents are processed before children
    const sortedKeys = Object.keys(obj).sort();
    for (const key of sortedKeys) {
        const parts = key.split('.');
        setNested(result, parts, obj[key]);
    }
    return result;
}

const dir = 'src/messages';
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
for (const file of files) {
    const content = JSON.parse(readFileSync(join(dir, file), 'utf-8'));
    const nested = flatToNested(content);
    writeFileSync(join(dir, file), JSON.stringify(nested, null, 2) + '\n');
    console.log('✓ Converted: ' + file);
}
console.log('Done - all message files converted to nested format');