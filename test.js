import { Corpus } from './index.js';
import tape from 'tape';

tape('number of documents in corpus', function (t) {
  t.plan(1);
  const corpus = new Corpus(['doc1', 'doc2'],['contents of doc1', 'contents of doc2']);
  const n = corpus.getDocumentIdentifiers().length;
  t.equal(n, 2);
});