/**
 * Wraps async functions to catch errors and pass them to the next middleware
 * Eliminates try/catch blocks in controllers
 * @param {Function} fn - The async function to wrap
 */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
