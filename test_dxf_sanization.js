
const sanitizeDxfText = (str) => {
  if (!str) return '';
  return str
    .replace(/\u00B2/g, '2')
    .replace(/\u00B3/g, '3')
    .replace(/ą/g, '\\U+0105').replace(/Ą/g, '\\U+0104')
    .replace(/ć/g, '\\U+0107').replace(/Ć/g, '\\U+0106')
    .replace(/ę/g, '\\U+0119').replace(/Ę/g, '\\U+0118')
    .replace(/ł/g, '\\U+0142').replace(/Ł/g, '\\U+0141')
    .replace(/ń/g, '\\U+0144').replace(/Ń/g, '\\U+0143')
    .replace(/ó/g, '\\U+00F3').replace(/Ó/g, '\\U+00D3')
    .replace(/ś/g, '\\U+015B').replace(/Ś/g, '\\U+015A')
    .replace(/ź/g, '\\U+017A').replace(/Ź/g, '\\U+0179')
    .replace(/ż/g, '\\U+017C').replace(/Ż/g, '\\U+017B');
};

const testText = "Pokój z klimatyzacją łódź";
console.log('Original:', testText);
console.log('Sanitized:', sanitizeDxfText(testText));
