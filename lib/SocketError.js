var createError = require('createerror');
var HttpError = require('httperrors');
var socketCodesMap = require('./socketCodesMap');

function allKeys(o) {
    var keys = [];

    for (var key in o) keys.push(key);

    return keys;
}

function createSocketError(errorCode) {
    var statusCode = socketCodesMap[errorCode] || 'Unknown';

    var options = {
        name: errorCode,
        code: errorCode,
        statusCode: statusCode,
        status: statusCode
    };

    // get constructed httpError to use to grab what we need to 'quack' like it
    var httpError = HttpError(statusCode);
    var httpErrorKeys = allKeys(httpError);

    // copy keys from the httpError to the socketError
    httpErrorKeys.forEach(function (key) {
        if (!options[key] && key !== 'message') {
            options[key] = httpError[key];
        }
    });
    options.http = false;
    options.HttpError = false;
    SocketError[errorCode] = createError(options, SocketError);
}

var SocketError = module.exports = createError({
    name: 'SocketError',
    preprocess: function (err) {
        if (!(err instanceof SocketError) && err !== 'NotSocketError') {
            if (!SocketError.supports(err)) {
                if (err) {
                    var errOptions = {};
                    if (err.code) {
                        errOptions.code = err.code;
                    }
                }

                return new SocketError.NotSocketError(errOptions);
            }

            if (typeof err === 'string') {
                return new SocketError[err]();
            } else if (err && err.code && socketCodesMap.hasOwnProperty(err.code)) {
                return new SocketError[err.code](err);
            }
        }
    }
});

SocketError.supports = function (errorOrErrorCode) {
    if (typeof errorOrErrorCode === 'string') {
        return socketCodesMap.hasOwnProperty(errorOrErrorCode);
    } else if (errorOrErrorCode && errorOrErrorCode.code) {
        return socketCodesMap.hasOwnProperty(errorOrErrorCode.code);
    } else {
        return false;
    }
};

// For backwards compatibility
SocketError.SocketError = SocketError;

// create an Unknown error sentinel
createSocketError('NotSocketError');

// create a new socket error for each error code
Object.keys(socketCodesMap).forEach(createSocketError);
