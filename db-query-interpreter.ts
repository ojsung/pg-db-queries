import { TQueryValue } from './unparsed-query.interface'

export class DbQueryInterpreter {
  /**
   * Take the array of keys and create the this equals that phrase for pg
   * @param keys the string of keys for the phrase
   */
  private static createPgEqualsPhrase(keys: string[]): string[] {
    const keyCount = keys.length
    const gatheredKeys = []
    for (let i = 0, j = keyCount; i < j; i++) {
      gatheredKeys.push(`${keys[i]} = $${i + 1}`)
    }
    return gatheredKeys
  }

  /**
   * Create the string and value array for postgresql's WHERE clause
   * @param where A JSON object with the keys as columns you want to filter, and the keys being the values to filter by
   * @returns A tuple with the first entry being the array of key strings and the second being the array of values
   */
  public static createWhereString(where: any): [string[], any[]] {
    const keys = Object.keys(where)
    const keyCount = keys.length
    const gatheredKeys = []
    const gatheredValues = []
    for (let i = 0, j = keyCount; i < j; i++) {
      const key = keys[i]
      gatheredKeys.push(`"${key}" = $${i + 1}`)
      gatheredValues.push(where[key])
    }
    return [gatheredKeys, gatheredValues]
  }

  /**
   * Appends 'AND' to the gathered keys.  It is wordy, but it will scale better using a for-loop and str concatenation
   *  than forEach + Array.join
   * @param gatheredKeys The gatheredKeys array returned from createWhere
   */
  public static appendAnd(gatheredKeys: string[]) {
    let gatheredKeyStrings = ''
    const gatheredKeyLength = gatheredKeys.length
    if (gatheredKeyLength > 1) {
      for (let i = 0, j = gatheredKeyLength; i < j; ++i) {
        gatheredKeyStrings = `${gatheredKeyStrings} AND ${gatheredKeys[i]}`
      }
    } else {
      gatheredKeyStrings = gatheredKeys[0]
    }
    return gatheredKeyStrings
  }

  /**
   * This will take the array of columns and make them something postgreSQL understands
   * @param columns The array of column names as strings
   */
  public static createColumnStrings(columns: string[]): [string, string] {
    let columnString = ''
    const columnLength: number = columns.length
    let columnCounterString = ''

    for (let i = 0, j = columnLength; i < j; ++i) {
      const index = i + 1
      if (i > 0) {
        columnString = `${columnString}, ${columns[i]}`
        columnCounterString = `${columnCounterString}, $${index}`
      } else {
        columnString = columns[i]
        columnCounterString = `$${index}`
      }
    }

    return [columnString, columnCounterString]
  }

  public static createSetString(columns: string[]) {
    const setArray: string[] = DbQueryInterpreter.createPgEqualsPhrase(columns)
    const setArrayLength: number = setArray.length
    let setString = ''
    for (let i = 0, j = setArrayLength; i < j; ++i) {
      setString = `${setString},${setArray[i]}`
    }
    return setString
  }

  public static flattenValuesArray(values: Array<Array<TQueryValue>>): TQueryValue[] {
    const flattenedArray = []
    const outerArrayLength = values.length
    for (let i = 0, j = outerArrayLength; i < j; ++i) {
      const innerArray = values[i] as Array<TQueryValue>
      const innerArrayLength = innerArray.length
      for (let k = 0, l = innerArrayLength; k < l; ++k) {
        flattenedArray.push(innerArray[k])
      }
    }
    return flattenedArray
  }

  /**
   * If the query is to insert many, this will create the needed VALUES string
   * This method is necessarily long because of the for loop and switch statement.
   * Refactoring this code would create a trivial, public method; and a meaty private method
   * @param columnLength the length of the columns array
   * @param values The array of array of values to be inserted
   */
  public static createInsertManyString(columnLength: number, values: Array<TQueryValue>): string {
    const valueLength = values.length
    const isCompatible = !(valueLength % columnLength)
    let insertManyString = ''
    if (isCompatible) {
      const noRemainder = 0
      const remainderNegativeOne = columnLength - 1
      const handleRemainderZero = DbQueryInterpreter.createRemainderZeroHandler(columnLength, valueLength)
      for (let i = 0, j = columnLength; i < j; ++i) {
        const oneBasedIndex = i + 1
        const remainder = i % columnLength
        switch (remainder) {
          case noRemainder:
            insertManyString += handleRemainderZero(oneBasedIndex)
            break
          case remainderNegativeOne:
            if (oneBasedIndex !== valueLength) {
              insertManyString += `$${oneBasedIndex}), `
            } else {
              insertManyString += `$${oneBasedIndex})`
            }
            break
          default:
            insertManyString += `$${oneBasedIndex},`
        }
      }
    }
    return insertManyString
  }

  /**
   * This function will check if there is only one column being inserted into, and if the value currently being
   * inserted is the last value to be inserted of all the values. If both or either of those is true,
   * it returns a different handler for that modulo zero element
   * @param columnLength The number of columns being inserted into
   * @param valueLength The number of values being inserted
   */
  private static createRemainderZeroHandler(columnLength: number, valueLength: number) {
    const columnLengthIsOne = columnLength === 1 ? true : false
    let handleRemainderZero: any
    if (columnLengthIsOne) {
      handleRemainderZero = (oneBasedIndex: number) => {
        const isLastElementOfValues = oneBasedIndex === valueLength ? true : false
        if (isLastElementOfValues) {
          return `($${oneBasedIndex})`
        } else {
          return `$${oneBasedIndex},`
        }
      }
    } else {
      handleRemainderZero = (oneBasedIndex: number) => {
        return `($${oneBasedIndex},`
      }
    }
    return handleRemainderZero
  }
}
