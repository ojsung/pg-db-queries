"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var pg_1 = require("pg");
var dbconfig_1 = require("../dbconfig");
var error_logger_1 = require("../shared/error-logger");
var db_query_interpreter_1 = require("./db-query-interpreter");
/**
 * A class to create a db connection and make db queries.  This is a very large class.
 * It instances pg's Pool class as a static variable
 */
var DbManager = /** @class */ (function () {
    function DbManager() {
    }
    DbManager.log = function (err) {
        error_logger_1.ErrorLogger.log(err, 'dbManager');
    };
    /**
     * Insert into the postgreSQL database.
     * @param table The name of the table to insert into,
     * @param columns The columns into which you will be inserting,
     * @param values Expects Array<TQueryValue> as the values to be inserted.
     * This must be ordered in the same order as columns.
     * If options.upsert contains a value, this will instead be the values to be upserted.
     * To insert many, change the type provided from Array<TQueryValue> to Array<Array<TQueryValue>>
     * @param upsert An optional paramater that expects the column name to check for conflict
     * @returns the resulting rows as an array
     */
    DbManager.prototype.insert = function (table, columns, values, upsert) {
        return __awaiter(this, void 0, void 0, function () {
            var commaSeparatedColumnNames, commaSeparatedColumnParameters, text, multipleValuesAreBeingInserted, columnLength, insertManyString, setString, query, rows;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = db_query_interpreter_1.DbQueryInterpreter.createColumnStrings(columns), commaSeparatedColumnNames = _a[0], commaSeparatedColumnParameters = _a[1];
                        text = "INSERT INTO \"" + table + "\"(\"" + commaSeparatedColumnNames + "\") ";
                        multipleValuesAreBeingInserted = Array.isArray(values[0]);
                        if (multipleValuesAreBeingInserted) {
                            columnLength = columns.length;
                            values = db_query_interpreter_1.DbQueryInterpreter.flattenValuesArray(values);
                            insertManyString = db_query_interpreter_1.DbQueryInterpreter.createInsertManyString(columnLength, values);
                            text = "VALUES" + insertManyString + " RETURNING *";
                        }
                        else {
                            text = "VALUES(" + commaSeparatedColumnParameters + ") RETURNING *";
                        }
                        if (upsert) {
                            setString = db_query_interpreter_1.DbQueryInterpreter.createSetString(columns);
                            text += "ON CONFLICT (" + upsert + ") DO UPDATE SET " + setString + " RETURNING *";
                        }
                        query = { text: text, values: values };
                        return [4 /*yield*/, this.clientCheckout(query)];
                    case 1:
                        rows = (_b.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    /**
     * Retrieve a value from the db
     * @param unparsedQuery This JSON must be in the following format:
     * {
     *    "table": "the name of the table",
     *    "columns": "The columns you want to pull",
     *    "where": "This is an optional column to narrow the search",
     *    "values": "This is an array containing a single value that you want to narrow the search by"
     * }
     * @returns The array of rows that were found
     */
    DbManager.prototype.select = function (unparsedQuery) {
        return __awaiter(this, void 0, void 0, function () {
            var columns, table, columnString, gatheredValues, gatheredKeys, text, where, query, gatheredKeyStrings, rows;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        columns = unparsedQuery.columns;
                        table = unparsedQuery.table;
                        columnString = db_query_interpreter_1.DbQueryInterpreter.createColumnStrings(columns)[0];
                        if (columnString === '*') {
                            text = "SELECT " + columnString + " FROM \"" + table + "\"";
                        }
                        else {
                            text = "SELECT \"" + columnString + "\" FROM \"" + table + "\"";
                        }
                        where = unparsedQuery.where;
                        if (where) {
                            _a = db_query_interpreter_1.DbQueryInterpreter.createWhere(where), gatheredKeys = _a[0], gatheredValues = _a[1];
                            gatheredKeyStrings = db_query_interpreter_1.DbQueryInterpreter.appendAnd(gatheredKeys);
                            text = text + " WHERE " + gatheredKeyStrings;
                            query = {
                                text: text,
                                values: gatheredValues
                            };
                        }
                        else {
                            query = { text: text };
                        }
                        return [4 /*yield*/, this.clientCheckout(query)];
                    case 1:
                        rows = (_b.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    /**
     * This is identical to the select query, except that it doesn't require a where field, and it narrows by id
     * @param unparsedQuery This JSON must be in the following format:
     *  {
     *    "table": "the name of the table",
     *    "columns": "The columns you want to pull",
     *    "_id": "this is a string value for the id"
     *  }
     * @returns The array of rows that were found
     */
    DbManager.prototype.selectById = function (unparsedQuery) {
        var selectQuery = {
            columns: unparsedQuery.columns,
            table: unparsedQuery.table,
            where: { _id: unparsedQuery._id }
        };
        return this.select(selectQuery);
    };
    /**
     * Update any entries that match your WHERE criteria
     * @param unparsedQuery This JSON must be in the following format:
     * {
     *    "table": "The name of the table",
     *    "set": "The JSON object where columns are keys, and the values are the values to be set"
     *    "where": "The filtering JSON object with the keys being columns and values being the value to filter by",
     * }
     * @returns The updated rows as an array
     */
    DbManager.prototype.update = function (unparsedQuery) {
        return __awaiter(this, void 0, void 0, function () {
            var set, columns, setString, table, where, keys, values, keyStrings, text, query, rows;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        set = unparsedQuery.set;
                        columns = Object.keys(set);
                        setString = db_query_interpreter_1.DbQueryInterpreter.createSetString(columns);
                        table = unparsedQuery.table;
                        where = unparsedQuery.where;
                        _a = db_query_interpreter_1.DbQueryInterpreter.createWhere(where), keys = _a[0], values = _a[1];
                        keyStrings = db_query_interpreter_1.DbQueryInterpreter.appendAnd(keys);
                        text = "UPDATE " + table + " SET " + setString + " WHERE " + keyStrings + " RETURNING *";
                        query = { text: text, values: values };
                        return [4 /*yield*/, this.clientCheckout(query)];
                    case 1:
                        rows = (_b.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    /**
     * This function takes the data for a trending report and inserts it into the db
     * @param data The trending data
     * @returns The resulting trending array that was created
     */
    DbManager.prototype.postTrending = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var trending, trendingLength, trendingString, i, j, trend, userString, text, query, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trending = data.trending;
                        trendingLength = trending.length;
                        trendingString = '';
                        for (i = 0, j = trendingLength; i < j; ++i) {
                            trend = trending[i];
                            if (i < j - 1) {
                                trendingString = trendingString + ("'" + JSON.stringify(trend) + "'::json,");
                            }
                            else {
                                trendingString = trendingString + ("'" + JSON.stringify(trend) + "'::json");
                            }
                        }
                        userString = "'" + JSON.stringify(data.user) + "'::json";
                        text = "INSERT INTO trending(\"trending\", \"user\", \"timeId\", \"endTimeId\") VALUES(ARRAY[" + trendingString + "]," + userString + "," + data.timeId + "," + data.endTimeId + ") RETURNING *";
                        query = { text: text };
                        return [4 /*yield*/, this.clientCheckout(query)];
                    case 1:
                        rows = (_a.sent()).rows;
                        return [2 /*return*/, rows];
                }
            });
        });
    };
    /**
     * This will listen for any "error" communications, and log them to the console
     * after that, it will end the process
     */
    DbManager.prototype.reportOnError = function () {
        DbManager.pool.on('error', function (err) {
            DbManager.log(err);
            process.exit(-1);
        });
    };
    /**
     * This will check out a client from the client pool and ask it to perform the query
     * @param query The query given by insert, select, or update
     */
    DbManager.prototype.clientCheckout = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, DbManager.pool.query(query)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                    case 2:
                        err_1 = _a.sent();
                        DbManager.log(err_1);
                        return [2 /*return*/, err_1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DbManager.pool = new pg_1.Pool(dbconfig_1.config);
    return DbManager;
}());
exports.DbManager = DbManager;
