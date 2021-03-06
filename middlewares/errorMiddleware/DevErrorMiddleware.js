const stdout = require('stdout-stream')
const chalk = require('chalk')
const stackTrace = require('stack-trace')
const ErrorResponse = require('./ErrorResponse')
const { errorCodes, BaseMiddleware } = require('supra-core')
const logger = require('../../logger')

class DevErrorMiddleware extends BaseMiddleware {
  async init () {
    logger.debug(`${this.constructor.name} initialized...`)
  }

  handler () {
    return (error, req, res, next) => {
      if (error.status === 404) {
        const errorRes = new ErrorResponse({
          ...error,
          src: `${process.env.NODE_ENV}:err:middleware`
        })

        res.status(errorRes.status).json(errorRes)
      } else {
        const errorRes = new ErrorResponse({
          ...error,
          code: error.code || errorCodes.SERVER.code,
          status: error.status || errorCodes.SERVER.status,
          message: error.message || error,
          stack: ![400, 401, 403, 422].includes(error.status) ? stackTrace.parse(error) : false,
          src: `${process.env.NODE_ENV}:err:middleware`
        })

        logger.error(errorRes.message, error, { ...errorRes, req: error.req, meta: error.meta })
        res.status(errorRes.status).json(errorRes)
      }

      if (error.stack) {
        stdout.write(chalk.red('--------------- ERROR STACK BEGIN --------------\n'))
        stdout.write(`${new Date()} env:dev/regular error\n`)
        stdout.write(chalk.blue(error.stack))
        stdout.write(chalk.red('\n---------------- ERROR STACK END ---------------\n\n'))
      }
    }
  }
}

module.exports = new DevErrorMiddleware()
