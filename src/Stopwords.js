// English stopwords, assuming tokenization has occurred and 1-letter tokens are already filtered
// out. Based on list from NLTK found at https://gist.github.com/sebleier/554280
const defaultStopwords = ['me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
  'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'an', 'the',
  'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 'can', 'will', 'just', 'don', 'could', 'should', 'would', 'now', 'll',
  're', 've', 'aren', 'couldn', 'didn', 'doesn', 'hadn', 'hasn', 'haven', 'isn', 'mustn', 'needn',
  'shouldn', 'wasn', 'weren', 'won', 'wouldn'];

export default class Stopwords {

  constructor(useDefaultStopwords = true, customStopwords = []) {
    const stopwords = useDefaultStopwords ? customStopwords.concat(defaultStopwords) : customStopwords;
    this._stopwords = new Map(stopwords.map(d => [d, true]));
  }

  // Test whether a word is a stopword
  includes(word) {
    return this._stopwords.has(word);
  }

  // Get the full list of stopwords currently in use (for inspection or debugging)
  getStopwordList() {
    return Array.from(this._stopwords.keys());
  }
}
