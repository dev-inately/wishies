/**
 * Generate A random string of any length
 * Excludes some special characters
 *
 * @author Yusuff Mustapha
 * @returns {String} - random string
 */
const randomStringGen = (length) => {
  const pass = 'qwertyuopasdfghjklzxcvbnmQWERTYUOPASDFGHJKLZXCVBNM234567890$';
  return Array(length).fill(pass).map((x) => x[Math.floor(Math.random() * x.length)]).join('');
};

/**
 * Generate UNIX-time string
 *
 * @author Yusuff Mustapha
 * @returns {String} - UNIX-time string as string
 */
const dateTimeString = () => new Date().getTime().toString();

function base64tostr(base64str) {
  return Buffer.from(base64str, 'base64').toString('ascii');
}

module.exports = {
  randomStringGen,
  dateTimeString,
  base64tostr,
};
