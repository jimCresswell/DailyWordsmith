import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read current words
const currentWordsPath = path.join(__dirname, '../server/data/curated-words-2000.json');
const currentWords = JSON.parse(fs.readFileSync(currentWordsPath, 'utf-8'));
const currentWordSet = new Set(currentWords.map((w: any) => w.word.toLowerCase()));

// Read CSV file
const csvPath = path.join(__dirname, '../attached_assets/_Word List Overlap Analysis.csv_1762902321836.txt');
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// Extract all words from CSV (skip header and stats rows)
const allCsvWords = new Set<string>();
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const columns = line.split(',');
  
  // Extract from first 9 columns (the actual word lists)
  for (let j = 0; j < Math.min(9, columns.length); j++) {
    const word = columns[j].trim();
    
    // Skip if empty, contains spaces (phrases), or has numbers/stats
    if (!word || word.includes(' ') || /\d/.test(word)) continue;
    
    allCsvWords.add(word.toLowerCase());
  }
}

// Find words not in our current list
const newWords = Array.from(allCsvWords).filter(word => !currentWordSet.has(word));

// Advanced words with particularly interesting etymologies
// These are known to have Greek/Latin roots, surprising origins, or rich historical backgrounds
const advancedEtymologyWords = [
  // Greek/Latin compounds with interesting stories
  'abscission', 'acolyte', 'aegis', 'anile', 'apoplectic', 'apostate', 'arriviste', 
  'atavism', 'automaton', 'bacchanalian', 'beatify', 'bedizen', 'behemoth', 'bifurcate',
  'blandishment', 'blase', 'bloviated', 'bonhomie', 'bootless', 'bowdlerize', 'bravado',
  'bucolic', 'cadaverous', 'cadge', 'canonical', 'cant', 'cantankerous', 'captious',
  'carnal', 'carping', 'cartography', 'caste', 'cataclysm', 'cathartic', 'catholic',
  'caucus', 'cavalier', 'celerity', 'celestial', 'centrifugal', 'centripetal', 'cessation',
  'chastise', 'chauvinistic', 'chivalry', 'chronological', 'circuitous', 'circumscribe',
  'circumspect', 'clairvoyant', 'clamber', 'clamor', 'clique', 'cloister', 'coda',
  'codify', 'coffer', 'cognizant', 'collage', 'collude', 'commensurate', 'compendium',
  'complacent', 'complaisant', 'compliant', 'compunction', 'concave', 'conciliatory',
  'concoct', 'concomitant', 'conflagration', 'connoisseur', 'contentious', 'contrite',
  'contumacious', 'convoluted', 'coruscate', 'cosset', 'crepuscular', 'craven',
  
  // Words with surprising origins
  'debacle', 'debunk', 'decorous', 'decrepit', 'defenestrate', 'defunct', 'deleterious',
  'demagogue', 'demur', 'denizen', 'deride', 'desiccate', 'desultory', 'dichotomy',
  'didactic', 'diffident', 'dilatory', 'dilettante', 'dirge', 'disabuse', 'discordant',
  'discrete', 'disparate', 'dissemble', 'disseminate', 'dissolution', 'dissonance',
  'distend', 'distill', 'diverge', 'divest', 'dogmatic', 'dormant', 'dour', 'dupe',
  
  // Rich classical origins
  'ebullient', 'eclectic', 'effete', 'effrontery', 'elegy', 'elicit', 'emolument',
  'empirical', 'emulate', 'endemic', 'enervate', 'engender', 'ennui', 'ephemeral',
  'equanimity', 'equivocate', 'erudite', 'esoteric', 'eulogy', 'euphemism', 'exacerbate',
  'exculpate', 'exigency', 'extrapolation', 'facetious', 'fallacious', 'fatuous',
  'fawning', 'felicitous', 'fervor', 'filibuster', 'flag', 'flout', 'foment',
  'forestall', 'fractious', 'frugality', 'fulminate', 'fulsome', 'futile',
  
  // Interesting compound words
  'gainsay', 'garrulous', 'gauche', 'germane', 'goad', 'gourmand', 'grandiloquent',
  'gregarious', 'guileless', 'gullible', 'hackneyed', 'halcyon', 'hapless', 'harangue',
  'hegemony', 'hermetic', 'heterogeneous', 'histrionic', 'homogeneous', 'hubris',
  'iconoclast', 'idiosyncrasy', 'ignominious', 'imbroglio', 'immutable', 'impassive',
  'impecunious', 'imperious', 'imperturbable', 'impetuous', 'implacable', 'implicit',
  'improvident', 'impugn', 'inadvertent', 'incarnate', 'inchoate', 'incongruous',
  'incontrovertible', 'inculcate', 'indolent', 'indomitable', 'ineffable', 'ineluctable',
  'inexorable', 'ingenuous', 'inimical', 'innocuous', 'insipid', 'insouciant',
  'intractable', 'intransigent', 'intrepid', 'inure', 'invective', 'inveterate',
  
  // Words with mythological/historical origins
  'Jovian', 'lachrymose', 'laconic', 'languid', 'lassitude', 'latent', 'laud',
  'loquacious', 'lucid', 'lugubrious', 'machination', 'maelstrom', 'magnanimity',
  'malingerer', 'malleable', 'martial', 'maudlin', 'mawkish', 'mendacious', 'mercurial',
  'meretricious', 'mettle', 'miscreant', 'misanthrope', 'mitigate', 'mollify',
  'moribund', 'morose', 'mundane', 'munificent', 'myriad',
  
  // Advanced Latin/Greek derivatives
  'nascent', 'nebulous', 'nefarious', 'nemesis', 'neophyte', 'nihilism', 'noisome',
  'nomenclature', 'nominal', 'nonplussed', 'nostalgic', 'noxious', 'nugatory',
  'obdurate', 'obfuscate', 'oblique', 'obsequious', 'obstinate', 'obtuse', 'officious',
  'onerous', 'opprobrium', 'ornate', 'ostentatious', 'palliate', 'panacea', 'panache',
  'panegyric', 'paradigm', 'paragon', 'parameter', 'paramount', 'pariah', 'parity',
  'parsimony', 'partisan', 'pastiche', 'patent', 'pathos', 'paucity', 'pedantic',
  'pedestrian', 'pellucid', 'penchant', 'penitent', 'pensive', 'penury', 'perfidious',
  'perfunctory', 'peripatetic', 'pernicious', 'perspicacious', 'pertinacious', 'peruse',
  'pervasive', 'petulant', 'philanthropy', 'philistine', 'phlegmatic', 'pious',
  'pique', 'pithy', 'placate', 'platitude', 'plethora', 'poignant', 'polemic',
  'ponderous', 'portent', 'pragmatic', 'precipitate', 'preclude', 'precocious',
  'predilection', 'prescient', 'prevaricate', 'pristine', 'probity', 'proclivity',
  'prodigal', 'prodigious', 'profligate', 'profuse', 'prolific', 'propitiate',
  'propitious', 'propriety', 'prosaic', 'proscribe', 'protean', 'provincial',
  'prudent', 'prurient', 'puerile', 'pugnacious', 'pulchritude', 'punctilious',
  'pungent', 'pusillanimous', 'putrefy', 'pyrrhic',
  
  // More interesting origins
  'quaint', 'qualm', 'quandary', 'querulous', 'quiescence', 'quintessential', 'quixotic',
  'quotidian', 'rakish', 'rancor', 'rapacious', 'recalcitrant', 'recant', 'recondite',
  'redoubtable', 'refute', 'rejoinder', 'remonstrate', 'renege', 'replete', 'reprehensible',
  'repudiate', 'rescind', 'reticent', 'reverent', 'rhetoric', 'ribald', 'rife',
  'rigorous', 'risible', 'rout', 'rue', 'sagacious', 'salacious', 'salient',
  'sallow', 'salutary', 'sanctimonious', 'sanguine', 'sardonic', 'satiate', 'saturnine',
  'savant', 'scintillating', 'scrupulous', 'sedulous', 'semantic', 'seminal', 'senescent',
  'sensuous', 'sentient', 'servile', 'shibboleth', 'sinecure', 'singular', 'sinuous',
  'skeptic', 'sobriety', 'solicitous', 'solipsism', 'soporific', 'sordid', 'sovereign',
  'specious', 'spurious', 'squalid', 'staid', 'stalwart', 'steadfast', 'stentorian',
  'stoic', 'stratify', 'strident', 'strife', 'stringent', 'stupefy', 'stymie',
  'suave', 'sublime', 'substantiate', 'subversive', 'succinct', 'superfluous', 'supine',
  'surfeit', 'sybarite', 'sycophant', 'synthesis',
  
  // Final advanced selections
  'taciturn', 'tangential', 'tawdry', 'temerity', 'temperament', 'tenable', 'tenacious',
  'tendentious', 'tenet', 'tenuous', 'terse', 'tirade', 'toady', 'tome', 'torpid',
  'tortuous', 'tractable', 'transcendent', 'transgress', 'transient', 'trite', 'truculence',
  'tryst', 'turgid', 'turpitude', 'tutelage', 'tyro', 'ubiquitous', 'umbrage',
  'unctuous', 'undulate', 'unequivocal', 'untenable', 'unwitting', 'upbraid', 'urbane',
  'usurp', 'vacillate', 'vacuous', 'vainglorious', 'vapid', 'variegated', 'vaunt',
  'vehement', 'venal', 'venerable', 'venerate', 'veracity', 'verbose', 'verdant',
  'verisimilitude', 'vernacular', 'vex', 'vicarious', 'vicissitude', 'vigilant', 'vilify',
  'vindicate', 'vindictive', 'virtuoso', 'virulent', 'viscous', 'vitiate', 'vitriolic',
  'vituperate', 'vivacious', 'vocation', 'vociferous', 'volition', 'voluble', 'voracious',
  'wane', 'wanton', 'wary', 'watershed', 'waver', 'wayward', 'welter', 'whimsical',
  'wistful', 'wizened', 'wrath', 'wry', 'xenophobia', 'yoke', 'zealot', 'zenith'
];

// Filter to only include words that are:
// 1. In the CSV file
// 2. Not in our current list
// 3. In our advanced etymology list
const wordsToAdd = newWords.filter(word => 
  advancedEtymologyWords.map(w => w.toLowerCase()).includes(word)
);

// Assign difficulty levels based on word complexity
function getDifficulty(word: string): number {
  // Very obscure or highly technical words
  const level10 = ['abscission', 'apoplectic', 'apostate', 'atavism', 'bacchanalian', 
    'bedizen', 'bowdlerize', 'coruscate', 'cosset', 'crepuscular', 'defenestrate',
    'ebullient', 'emolument', 'ennui', 'hermetic', 'iconoclast', 'ignominious',
    'imbroglio', 'ineluctable', 'lachrymose', 'maelstrom', 'meretricious', 
    'munificent', 'nugatory', 'pellucid', 'peripatetic', 'pulchritude', 'pusillanimous',
    'pyrrhic', 'recondite', 'soporific', 'sybarite', 'temerity', 'turgid', 
    'turpitude', 'verisimilitude', 'vituperate'];
  
  // Advanced but encountered in GRE prep
  const level9 = ['acolyte', 'aegis', 'anile', 'arriviste', 'beatify', 'behemoth',
    'blandishment', 'bloviated', 'cadaverous', 'cant', 'cathartic', 'cavalier',
    'circumlocution', 'clairvoyant', 'conflagration', 'contentious', 'contumacious',
    'debacle', 'demagogue', 'dilettante', 'effete', 'elegy', 'erudite', 'eulogy',
    'fulminate', 'fulsome', 'grandiloquent', 'halcyon', 'histrionic', 'hubris',
    'idiosyncrasy', 'impecunious', 'imperious', 'implacable', 'inchoate', 'indomitable',
    'ineffable', 'inexorable', 'invective', 'laconic', 'lugubrious', 'machination',
    'maudlin', 'mendacious', 'mercurial', 'misanthrope', 'moribund', 'nefarious',
    'nemesis', 'obsequious', 'ostentatious', 'panache', 'panegyric', 'parsimony',
    'paucity', 'pedantic', 'penchant', 'perfidious', 'perspicacious', 'petulant',
    'platitude', 'proclivity', 'prodigious', 'propitious', 'proscribe', 'protean',
    'pugnacious', 'quixotic', 'rapacious', 'recalcitrant', 'redoubtable', 'repudiate',
    'ribald', 'sagacious', 'salacious', 'sardonic', 'scintillating', 'sinecure',
    'solipsism', 'stentorian', 'stolid', 'sycophant', 'truculent', 'unctuous',
    'venal', 'verbose', 'vilify', 'virulent', 'vitriolic', 'vociferous', 'voracious'];
  
  // Upper-intermediate difficulty
  const level8 = ['bifurcate', 'blase', 'bucolic', 'cadge', 'canonical', 'cantankerous',
    'captious', 'carnal', 'carping', 'caste', 'cataclysm', 'caucus', 'celerity',
    'cessation', 'chastise', 'circuitous', 'circumscribe', 'circumspect', 'clamor',
    'clique', 'cloister', 'coda', 'codify', 'cognizant', 'collage', 'collude',
    'commensurate', 'compendium', 'complacent', 'complaisant', 'compliant', 'concave',
    'conciliatory', 'concoct', 'concomitant', 'connoisseur', 'contrite', 'convoluted',
    'craven', 'debunk', 'decorous', 'decrepit', 'defunct', 'deleterious', 'demur',
    'denizen', 'desiccate', 'desultory', 'dichotomy', 'didactic', 'diffident',
    'dilatory', 'dirge', 'disabuse', 'discordant', 'discrete', 'disparate',
    'dissemble', 'disseminate', 'dissolution', 'dissonance', 'distend', 'distill',
    'diverge', 'divest', 'dogmatic', 'dormant', 'dour', 'dupe', 'eclectic',
    'effrontery', 'elicit', 'empirical', 'emulate', 'endemic', 'enervate',
    'engender', 'ephemeral', 'equanimity', 'equivocate', 'esoteric', 'euphemism',
    'exacerbate', 'exculpate', 'exigency', 'extrapolation', 'facetious', 'fallacious',
    'fatuous', 'fawning', 'felicitous', 'fervor', 'flag', 'flout', 'foment',
    'forestall', 'fractious', 'frugality', 'futile', 'gainsay', 'garrulous',
    'gauche', 'germane', 'goad', 'guileless', 'gullible', 'hackneyed', 'hapless',
    'harangue', 'hegemony', 'heterogeneous', 'homogeneous', 'immutable', 'impassive',
    'imperturbable', 'impetuous', 'improvident', 'impugn', 'inadvertent', 'incarnate',
    'incongruous', 'incontrovertible', 'inculcate', 'indolent', 'ingenuous',
    'inimical', 'innocuous', 'insipid', 'insouciant', 'intractable', 'intransigent',
    'intrepid', 'inure', 'inveterate', 'languid', 'lassitude', 'latent', 'laud',
    'loquacious', 'lucid', 'magnanimity', 'malingerer', 'malleable', 'martial',
    'mawkish', 'mettle', 'miscreant', 'mitigate', 'mollify', 'morose', 'mundane',
    'myriad', 'nascent', 'nebulous', 'neophyte', 'nihilism', 'noisome', 'nomenclature',
    'nominal', 'nonplussed', 'nostalgic', 'noxious', 'obdurate', 'obfuscate',
    'oblique', 'obstinate', 'obtuse', 'officious', 'onerous', 'opprobrium', 'ornate',
    'palliate', 'panacea', 'paradigm', 'paragon', 'parameter', 'paramount', 'pariah',
    'parity', 'partisan', 'pastiche', 'patent', 'pathos', 'penitent', 'pensive',
    'penury', 'perfunctory', 'pernicious', 'pertinacious', 'peruse', 'pervasive',
    'philanthropy', 'philistine', 'phlegmatic', 'pious', 'pique', 'pithy', 'placate',
    'plethora', 'poignant', 'polemic', 'ponderous', 'portent', 'pragmatic',
    'precipitate', 'preclude', 'precocious', 'predilection', 'prescient', 'prevaricate',
    'pristine', 'probity', 'prodigal', 'profligate', 'profuse', 'prolific',
    'propitiate', 'propriety', 'prosaic', 'provincial', 'prudent', 'prurient',
    'puerile', 'punctilious', 'pungent', 'putrefy', 'quaint', 'qualm', 'quandary',
    'querulous', 'quiescence', 'quintessential', 'quotidian', 'rakish', 'rancor',
    'recant', 'refute', 'rejoinder', 'remonstrate', 'renege', 'replete',
    'reprehensible', 'rescind', 'reticent', 'reverent', 'rhetoric', 'rife',
    'rigorous', 'risible', 'rout', 'rue', 'salutary', 'sanctimonious', 'sanguine',
    'satiate', 'saturnine', 'savant', 'scrupulous', 'sedulous', 'semantic', 'seminal',
    'senescent', 'sensuous', 'sentient', 'servile', 'shibboleth', 'singular',
    'sinuous', 'skeptic', 'sobriety', 'solicitous', 'sordid', 'sovereign', 'specious',
    'spurious', 'squalid', 'staid', 'stalwart', 'steadfast', 'stoic', 'stratify',
    'strident', 'strife', 'stringent', 'stupefy', 'stymie', 'suave', 'sublime',
    'substantiate', 'subversive', 'succinct', 'superfluous', 'supine', 'surfeit',
    'synthesis', 'taciturn', 'tangential', 'tawdry', 'temperament', 'tenable',
    'tenacious', 'tendentious', 'tenet', 'tenuous', 'terse', 'tirade', 'toady',
    'tome', 'torpid', 'tortuous', 'tractable', 'transcendent', 'transgress',
    'transient', 'trite', 'truculence', 'tryst', 'tutelage', 'tyro', 'ubiquitous',
    'umbrage', 'undulate', 'unequivocal', 'untenable', 'unwitting', 'upbraid',
    'urbane', 'usurp', 'vacillate', 'vacuous', 'vainglorious', 'vapid', 'variegated',
    'vaunt', 'vehement', 'venerable', 'venerate', 'veracity', 'verdant', 'vernacular',
    'vex', 'vicarious', 'vicissitude', 'vigilant', 'vindicate', 'vindictive',
    'virtuoso', 'viscous', 'vitiate', 'vivacious', 'vocation', 'volition', 'voluble',
    'wane', 'wanton', 'wary', 'watershed', 'waver', 'wayward', 'welter', 'whimsical',
    'wistful', 'wizened', 'wrath', 'wry', 'xenophobia', 'yoke', 'zealot', 'zenith'];
  
  const wordLower = word.toLowerCase();
  if (level10.includes(wordLower)) return 10;
  if (level9.includes(wordLower)) return 9;
  if (level8.includes(wordLower)) return 8;
  return 7; // Default for other advanced words
}

// Create formatted word list
const formattedWords = wordsToAdd.map(word => ({
  word: word,
  difficulty: getDifficulty(word)
}));

// Sort by difficulty (highest first), then alphabetically
formattedWords.sort((a, b) => {
  if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
  return a.word.localeCompare(b.word);
});

// Output results
console.log(`Total words in CSV: ${allCsvWords.size}`);
console.log(`Words not in current list: ${newWords.length}`);
console.log(`Advanced words with interesting etymologies to add: ${formattedWords.length}`);
console.log('\nSample words to add:');
formattedWords.slice(0, 20).forEach(w => console.log(`  ${w.word} (difficulty: ${w.difficulty})`));

// Save to file
const outputPath = path.join(__dirname, '../server/data/advanced-words-to-add.json');
fs.writeFileSync(outputPath, JSON.stringify(formattedWords, null, 2));
console.log(`\nSaved ${formattedWords.length} words to ${outputPath}`);
