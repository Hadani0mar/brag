import { T, ITEMS, DURATION, LINES } from '../src/timeline.js';
import fs from 'fs';
fs.writeFileSync('audio/timeline.json', JSON.stringify({ T, ITEMS, DURATION, LINES }, null, 1));
