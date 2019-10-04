"use strict";
exports.__esModule = true;
var DbQueryInterpreter = /** @class */ (function () {
    function DbQueryInterpreter() {
    }
    /**
     * Take the array of keys and create the this equals that phrase for pg
     * @param keys the string of keys for the phrase
     */
    DbQueryInterpreter.createPgEqualsPhrase = function (keys) {
        var keyCount = keys.length;
        var gatheredKeys = [];
        for (var i = 0, j = keyCount; i < j; i++) {
            gatheredKeys.push(keys[i] + " = $" + (i + 1));
        }
        return gatheredKeys;
    };
    /**
     * Create the string and value array for postgresql's WHERE clause
     * @param where A JSON object with the keys as columns you want to filter, and the keys being the values to filter by
     * @returns A tuple with the first entry being the array of key strings and the second being the array of values
     */
    DbQueryInterpreter.createWhere = function (where) {
        var keys = Object.keys(where);
        var keyCount = keys.length;
        var gatheredKeys = [];
        var gatheredValues = [];
        for (var i = 0, j = keyCount; i < j; i++) {
            var key = keys[i];
            gatheredKeys.push("\"" + key + "\" = $" + (i + 1));
            gatheredValues.push(where[key]);
        }
        return [gatheredKeys, gatheredValues];
    };
    /**
     * Appends 'AND' to the gathered keys.  It is wordy, but it will scale better using a for-loop and str concatenation
     *  than forEach + Array.join
     * @param gatheredKeys The gatheredKeys array returned from createWhere
     */
    DbQueryInterpreter.appendAnd = function (gatheredKeys) {
        var gatheredKeyStrings = '';
        var gatheredKeyLength = gatheredKeys.length;
        if (gatheredKeyLength > 1) {
            for (var i = 0, j = gatheredKeyLength; i < j; ++i) {
                gatheredKeyStrings = gatheredKeyStrings + " AND " + gatheredKeys[i];
            }
        }
        else {
            gatheredKeyStrings = gatheredKeys[0];
        }
        return gatheredKeyStrings;
    };
    /**
     * This will take the array of columns and make them something postgreSQL understands
     * @param columns The array of column names as strings
     */
    DbQueryInterpreter.createColumnStrings = function (columns) {
        var columnString = '';
        var columnLength = columns.length;
        var columnCounterString = '';
        for (var i = 0, j = columnLength; i < j; ++i) {
            var index = i + 1;
            if (i > 0) {
                columnString = columnString + ", " + columns[i];
                columnCounterString = columnCounterString + ", $" + index;
            }
            else {
                columnString = columns[i];
                columnCounterString = "$" + index;
            }
        }
        return [columnString, columnCounterString];
    };
    DbQueryInterpreter.createSetString = function (columns) {
        var setArray = DbQueryInterpreter.createPgEqualsPhrase(columns);
        var setArrayLength = setArray.length;
        var setString = '';
        for (var i = 0, j = setArrayLength; i < j; ++i) {
            setString = setString + "," + setArray[i];
        }
        return setString;
    };
    DbQueryInterpreter.flattenValuesArray = function (values) {
        var flattenedArray = [];
        var outerArrayLength = values.length;
        for (var i = 0, j = outerArrayLength; i < j; ++i) {
            var innerArray = values[i];
            var innerArrayLength = innerArray.length;
            for (var k = 0, l = innerArrayLength; k < l; ++k) {
                flattenedArray.push(innerArray[k]);
            }
        }
        return flattenedArray;
    };
    /**
     * If the query is to insert many, this will create the needed VALUES string
     * This method is necessarily long because of the for loop and switch statement.
     * Refactoring this code would create a trivial, public method; and a meaty private method
     * @param columnLength the length of the columns array
     * @param values The array of array of values to be inserted
     */
    DbQueryInterpreter.createInsertManyString = function (columnLength, values) {
        var valueLength = values.length;
        var isCompatible = !(valueLength % columnLength);
        var insertManyString = '';
        if (isCompatible) {
            var noRemainder = 0;
            var remainderNegativeOne = columnLength - 1;
            var handleRemainderZero = DbQueryInterpreter.createRemainderZeroHandler(columnLength, valueLength);
            for (var i = 0, j = columnLength; i < j; ++i) {
                var oneBasedIndex = i + 1;
                var remainder = i % columnLength;
                switch (remainder) {
                    case noRemainder:
                        insertManyString += handleRemainderZero(oneBasedIndex);
                        break;
                    case remainderNegativeOne:
                        if (oneBasedIndex !== valueLength) {
                            insertManyString += "$" + oneBasedIndex + "), ";
                        }
                        else {
                            insertManyString += "$" + oneBasedIndex + ")";
                        }
                        break;
                    default:
                        insertManyString += "$" + oneBasedIndex + ",";
                }
            }
        }
        return insertManyString;
    };
    /**
     * This function will check if there is only one column being inserted into, and if the value currently being
     * inserted is the last value to be inserted of all the values. If both or either of those is true,
     * it returns a different handler for that modulo zero element
     * @param columnLength The number of columns being inserted into
     * @param valueLength The number of values being inserted
     */
    DbQueryInterpreter.createRemainderZeroHandler = function (columnLength, valueLength) {
        var columnLengthIsOne = columnLength === 1 ? true : false;
        var handleRemainderZero;
        if (columnLengthIsOne) {
            handleRemainderZero = function (oneBasedIndex) {
                var isLastElementOfValues = oneBasedIndex === valueLength ? true : false;
                if (isLastElementOfValues) {
                    return "($" + oneBasedIndex + ")";
                }
                else {
                    return "$" + oneBasedIndex + ",";
                }
            };
        }
        else {
            handleRemainderZero = function (oneBasedIndex) {
                return "($" + oneBasedIndex + ",";
            };
        }
        return handleRemainderZero;
    };
    return DbQueryInterpreter;
}());
exports.DbQueryInterpreter = DbQueryInterpreter;
