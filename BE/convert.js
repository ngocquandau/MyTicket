import fs from 'fs';
import showdown from 'showdown';

const converter = new showdown.Converter();
const markdown = fs.readFileSync('tests/test-report.md', 'utf8');
const html = converter.makeHtml(markdown);

fs.writeFileSync('tests/test-report.html', html);
console.log('Converted to HTML');