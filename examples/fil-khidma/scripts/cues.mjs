import { CUES, DURATION } from '../src/timeline.js';
import fs from 'fs';
fs.writeFileSync('audio/cues.json', JSON.stringify({ duration: DURATION, cues: CUES }, null, 1));
