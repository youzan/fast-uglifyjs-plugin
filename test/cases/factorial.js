function factorial(num) {
    var result = 1;
    if (num == 0 || num == 1) {
        result = num;
    } else {
        result = num * factorial(num - 1);
    }
    return result;
}

module.exports = global.factorial = factorial;