import { Pool, QueryConfig, QueryResult } from 'pg'
import { config } from './dbconfig'
import { DbQueryInterpreter } from './db-query-interpreter'
import {
  IUnparsedIdQuery,
  IUnparsedQuery,
  IUnparsedUpdateQuery,
  TQueryValue
} from './unparsed-query.interface'

/**
 * A class to create a db connection and make db queries.  This is a very large class.
 * It instances pg's Pool class as a static variable
 */
export class DbManager {
  private static pool = new Pool(config)
  private static log(err: any) {
    // your favorite function to catch errors.  Probably not console.log... that's just here because I don't know what you'd want
    console.log('error reported from dbManager: ' + err)
  }

  constructor() {}

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
  public async insert(
    table: string,
    columns: string[],
    values: Array<TQueryValue> | Array<Array<TQueryValue>>,
    upsert?: any
  ): Promise<any[]> {
    const [commaSeparatedColumnNames, commaSeparatedColumnParameters] = DbQueryInterpreter.createColumnStrings(columns)
    let text = `INSERT INTO "${table}"("${commaSeparatedColumnNames}") `
    const multipleValuesAreBeingInserted = Array.isArray(values[0])
    if (multipleValuesAreBeingInserted) {
      const columnLength = columns.length
      values = DbQueryInterpreter.flattenValuesArray(values as Array<Array<TQueryValue>>)
      const insertManyString = DbQueryInterpreter.createInsertManyString(columnLength, values)
      text = `VALUES${insertManyString} RETURNING *`
    } else {
      text = `VALUES(${commaSeparatedColumnParameters}) RETURNING *`
    }
    if (upsert) {
      const setString = DbQueryInterpreter.createSetString(columns)
      text += `ON CONFLICT (${upsert}) DO UPDATE SET ${setString} RETURNING *`
    }
    const query: QueryConfig = { text, values }
    const { rows } = await this.clientCheckout(query)
    return rows
  }

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
  public async select(unparsedQuery: IUnparsedQuery): Promise<any[]> {
    const columns = unparsedQuery.columns
    const table = unparsedQuery.table
    const columnString: string = DbQueryInterpreter.createColumnStrings(columns)[0]
    let text: string
    if (columnString === '*') {
      text = `SELECT ${columnString} FROM "${table}"`
    } else {
      text = `SELECT "${columnString}" FROM "${table}"`
    }
    const where: any = unparsedQuery.where
    let query: QueryConfig
    if (where) {
      const [gatheredKeys, gatheredValues] = DbQueryInterpreter.createWhereString(where)
      const gatheredKeyStrings = DbQueryInterpreter.appendAnd(gatheredKeys)
      text = `${text} WHERE ${gatheredKeyStrings}`
      query = {
        text,
        values: gatheredValues
      }
    } else {
      query = { text }
    }
    const { rows } = await this.clientCheckout(query)
    return rows
  }

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
  public selectById(unparsedQuery: IUnparsedIdQuery): Promise<any[]> {
    const selectQuery = {
      columns: unparsedQuery.columns,
      table: unparsedQuery.table,
      where: { _id: unparsedQuery._id }
    }
    return this.select(selectQuery)
  }

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
  public async update(unparsedQuery: IUnparsedUpdateQuery): Promise<any[]> {
    const set: any = unparsedQuery.set
    const columns = Object.keys(set)
    const setString = DbQueryInterpreter.createSetString(columns)
    const table: string = unparsedQuery.table
    const where: any = unparsedQuery.where
    const [keys, values] = DbQueryInterpreter.createWhereString(where)
    const keyStrings = DbQueryInterpreter.appendAnd(keys)
    const text = `UPDATE ${table} SET ${setString} WHERE ${keyStrings} RETURNING *`
    const query = { text, values }
    const { rows } = await this.clientCheckout(query)
    return rows
  }

  /**
   * This will listen for any "error" communications, and log them to the console
   * after that, it will end the process
   */
  public reportOnError(): void {
    DbManager.pool.on('error', (err: Error) => {
      DbManager.log(err)
      process.exit(-1)
    })
  }

  /**
   * This will check out a client from the client pool and ask it to perform the query
   * @param query The query given by insert, select, or update
   */
  private async clientCheckout(query: QueryConfig): Promise<QueryResult> {
    try {
      const res = await DbManager.pool.query(query)
      return res
    } catch (err) {
      DbManager.log(err)
      return err as any
    }
  }
}
