var UNKNOWN_SIZE = new Buffer([0x01, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);

var api = {};
api.readVint = function(buffer, start) {
    start = start || 0;
    for (var length = 1; length <= 8; length++) {
        if (buffer[start] >= Math.pow(2, 8 - length)) {
            break;
        }
    }
    if (length > 8) {
        throw new Error("Unrepresentable length: " + length + " " +
            buffer.toString('hex', start, start + length));
    }
    if (start + length > buffer.length) {
        return null;
    }
    var mask = (1 << (8 - length)) - 1;
    var value = buffer[start] & mask;
    var allOnes = !(~value & mask);
    for (i = 1; i < length; i++) {
        if (i === 7) {
            if (value >= Math.pow(2, 53 - 8) && buffer[start + 7] > 0) {
                return {
                    length: length,
                    value: -1
                };
            }
        }
        value *= Math.pow(2, 8);
        value += buffer[start + i];
        allOnes = allOnes && !(~buffer[start + i] & 0xFF);
    }
    // special value.
    if (allOnes)
        value = -1;
    return {
        length: length,
        value: value
    };
};

api.writeVint = function(value, minLength) {
    if (!Number.isSafeInteger(value))
        throw new Error('Unrepresentable value: ' + value);
    if (minLength > 8)
        throw new Error('Unsupported length : ' + minLength);
    if (value < 0)
        return new Buffer(UNKNOWN_SIZE);
    // max value = 2 ^ length - 2, Math.log is not precise enough
    for (var length = 1; length <= 8; length++) {
        if (value < Math.pow(2, 7 * length) - 1) {
            break;
        }
    }
    if (length < minLength)
        length = minLength;
    var buffer = new Buffer(length);
    for (i = 1; i <= length; i++) {
        var b = value & 0xFF;
        buffer[length - i] = b;
        value -= b;
        value /= Math.pow(2, 8);
    }
    buffer[0] = buffer[0] | (1 << (8 - length));
    return buffer;
};


api.readUInt = function(buffer, start) {
    start = start || 0;
    var f = buffer.readUIntBE(start, Math.min(buffer.length, 6));
    if (buffer.length <= 6) {
        return f;
    }

    // readUintBE only supports 48 bits
    for (var i = start + 6; i < buffer.length; i++) {
        f = f * 256 + buffer[i];
    }
    return f;
};

api.writeUInt = function(number) {
    var buf = new Buffer(8);
    buf.writeUIntBE(number, 0, 8);
    return buf;
};

api.readFloat = function(buffer) {
    if (buffer.length === 4)
        return buffer.readFloatBE(0);else if (buffer.length === 8) return buffer.readDoubleBE(0)
    ;
    throw new Error('unsuppoted float');
};

api.writeFloat = function(number) {
    var buf = new Buffer(8);
    buf.writeDoubleBE(number, 0);
    return buf;
};

module.exports = api;
