interface IUnparsedBaseQuery {
  table: string,
  columns: Array<string>,
}

export type TQueryValue = string | number | boolean

export interface IUnparsedQuery extends IUnparsedBaseQuery {
  where?: any
}

export interface IUnparsedIdQuery extends IUnparsedBaseQuery {
  _id: string
}

export interface IUnparsedUpdateQuery {
  table: string,
  where: any,
  set: any
}
