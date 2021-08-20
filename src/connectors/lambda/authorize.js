const logger = require('../logger');
const responder = require('./util/responder');
const controllers = require('../controllers');

module.exports.handler = (event, context, callback) => {
  const {
    client_id,
    scope,
    state,
    response_type
  } = event.queryStringParameters;

  logger.debug('Calling controllers.authorize()');
  controllers(responder(callback)).authorize(
    client_id,
    scope,
    state,
    response_type
  );
};
