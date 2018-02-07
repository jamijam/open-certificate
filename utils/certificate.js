const {MerkleTree} = require('./merkle');
const {flattenJson, hashToBuffer, toBuffer} = require('./utils');

function evidenceTree (certificate) {
  const {
    evidence,
    privateEvidence
  } = certificate.badge;

  let evidenceHashes = [];

  // Flatten visible evidencee and hash each of them
  if (evidence) {
    const flattenedEvidence = flattenJson(evidence);
    const hashedEvidences = flattenedEvidence.map(e => toBuffer(e));
    evidenceHashes = evidenceHashes.concat(hashedEvidences);
  }

  // Include all private evidence hashes
  if (privateEvidence) {
    const hashedPrivateEvidences = privateEvidence.map(e => hashToBuffer(e));
    evidenceHashes = evidenceHashes.concat(hashedPrivateEvidences);
  }

  // Build a merkle tree with all the hashed evidences
  const tree = new MerkleTree(evidenceHashes);

  return tree;
}

// TODO MAKE THIS INTO A PURE FUNCTION!
function certificateTree(certificate, evidenceTree) {
  const cert = Object.assign({}, certificate);
  if (cert.signature) delete cert.signature;
  if (cert.badge.evidence) delete cert.badge.evidence;
  if (cert.badge.privateEvidence) delete cert.badge.privateEvidence;

  if (evidenceTree) {
    cert.badge.evidenceRoot = evidenceTree.getRoot().toString('hex');
  }

  const flattenedCertificate = flattenJson(cert);
  const certificateElements = flattenedCertificate.map(e => toBuffer(e));

  const tree = new MerkleTree(certificateElements);

  return tree;
}

function Certificate (certificate) {
  // Build an evidence tree if either evidence or private evidence is present
  if (certificate.badge.evidence || certificate.badge.privateEvidence) {
    this.evidenceTree = evidenceTree(certificate);
    this.evidenceRoot = this.evidenceTree.getRoot().toString('hex');
  }

  this.certificateTree = certificateTree(certificate, this.evidenceTree);
}

Certificate.prototype.getRoot = function () {
  return this.certificateTree.getRoot();
};

module.exports = Certificate;
