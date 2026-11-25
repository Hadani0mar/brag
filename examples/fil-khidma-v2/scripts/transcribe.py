import json, sys
from faster_whisper import WhisperModel
m = WhisperModel('small', device='cpu', compute_type='int8')
segs, info = m.transcribe('audio/voice.wav', language='ar', word_timestamps=True, vad_filter=False)
words = []
for s in segs:
    for w in s.words:
        words.append({'w': w.word.strip(), 'a': round(w.start, 2), 'b': round(w.end, 2)})
json.dump(words, open('audio/words.json', 'w'), ensure_ascii=False, indent=0)
print(' '.join(f"{x['w']}@{x['a']}" for x in words))
