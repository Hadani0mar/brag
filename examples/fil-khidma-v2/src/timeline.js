// One timing file. Placeholder times until the Gemini voice arrives; then every line is moved onto its spoken words.
export const FPS = 60;
export const DURATION = 32.5;

// narration lines (Libyan, Tripoli): start, end, words to highlight in orange
export const LINES = [
  { id: 'l1', a: 0.0, b: 1.55, text: 'تطبيق ليبي واحد… يوفّرلك كل شي!', hi: ['كل', 'شي!'] },
  { id: 'l2', a: 1.6, b: 5.2, text: 'كروت عالمية ومحلية، اشتراكات، كهرباء… وحتى ناب الدولار!', hi: [] },
  { id: 'l3', a: 5.3, b: 6.9, text: 'اسمه… في الخدمة.', hi: ['في', 'الخدمة.'] },
  { screen: 'كروتك العالمية… فوري وبأمان.', id: 'l4', a: 7.1, b: 10.8, text: 'تبي تشحن ببجي ولا نتفليكس؟ كروتك العالمية جاهزة… فوري وبأمان.', hi: ['فوري', 'وبأمان.'] },
  { screen: 'رصيدك المحلي من نفس المكان.', id: 'l5', a: 11.0, b: 13.8, text: 'رصيد ليبيانا والمدار و\u00A0LTT… من نفس المكان.', hi: ['نفس', 'المكان.'] },
  { id: 'l6', a: 14.0, b: 15.3, text: 'وهذا مش كل شي…', hi: ['مش', 'كل', 'شي…'] },
  { screen: 'نجوم وبريميوم تيليجرام… وخلاص.', id: 'l7', a: 15.5, b: 18.7, text: 'نجوم تيليجرام وبريميوم… تكتب معرّفك وخلاص.', hi: ['وخلاص.'] },
  { screen: 'اشحن عدّاد الكهرباء في ثواني.', id: 'l8', a: 18.9, b: 22.5, text: 'عدّاد الكهرباء؟ مع خالص تشحنه من محفظتك في ثواني.', hi: ['في', 'ثواني.'] },
  { screen: 'فنيين… وطلباتك خطوة بخطوة.', id: 'l9', a: 22.7, b: 26.7, text: 'وتلقى فنيين في كل تخصص… وتتابع طلباتك خطوة بخطوة.', hi: ['فنيين…', 'وطلباتك'] },
  { id: 'l10', a: 26.9, b: 32.5, text: 'في الخدمة… التطبيق الأول في ليبيا لخدمة المواطن إلكترونياً.', hi: [] }
];

// the hook's items, each on its spoken word
export const ITEMS = [
  { at: 1.7, word: 'كروت عالمية', tiles: ['netflix', 'pubg'] },
  { at: 2.35, word: 'ومحلية', tiles: ['libyana', 'madar', 'ltt'] },
  { at: 3.05, word: 'اشتراكات', tiles: ['canva', 'stars'] },
  { at: 3.75, word: 'كهرباء', tiles: ['khalis'] },
  { at: 4.45, word: 'وحتى ناب الدولار!', tiles: ['nab'] }
];

export const T = {
  merge: 5.35, // the icons gather into the app's mark
  toGlobal: 6.95, toLocal: 10.85, reveal: 13.95, toTg: 15.3, toKh: 18.75, toTech: 22.55, toEnd: 26.75,
  typeStart: 16.6, typeStep: 0.1, tgTap: 17.6, tgChip: 17.9, khTap: 21.0, techTap: 23.6, ordersTap: 25.4
};
